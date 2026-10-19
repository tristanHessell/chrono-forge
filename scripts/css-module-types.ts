import { readdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

import camelCase from 'lodash.camelcase';
import postcss from 'postcss';
import selectorParser from 'postcss-selector-parser';
import { SourceMapGenerator } from 'source-map-js';
import { type Plugin, preprocessCSS, type ResolvedConfig } from 'vite';

const generatedHeader = '// Generated CSS module types. Do not edit.\n';

type ClassPosition = { line: number; column: number; length: number };

async function listFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const groups = await Promise.all(
    entries.map((entry) => {
      const file = path.join(directory, entry.name);

      return entry.isDirectory() ? listFiles(file) : [file];
    }),
  );

  return groups.flat().sort();
}

function classPositions(css: string, file: string): Map<string, ClassPosition> {
  const positions = new Map<string, ClassPosition>();
  const root = postcss.parse(css, { from: file });

  root.walkRules((rule) => {
    selectorParser((selectors) => {
      selectors.walkClasses((node) => {
        for (let ancestor = node.parent; ancestor; ancestor = ancestor.parent) {
          if (ancestor.type === 'pseudo' && ancestor.value === ':global') {
            return;
          }
        }

        const key = camelCase(node.value);
        const prefix = rule.selector.slice(0, node.sourceIndex);
        const lines = prefix.split('\n');
        const line = rule.source!.start!.line + lines.length - 1;
        const column =
          lines.length === 1
            ? rule.source!.start!.column + node.sourceIndex
            : lines.at(-1)!.length + 1;

        if (!positions.has(key)) {
          positions.set(key, {
            line,
            column,
            length: node.toString().trim().length - 1,
          });
        }
      });
    }).processSync(rule.selector);
  });
  root.walkAtRules('keyframes', (rule) => {
    const key = camelCase(rule.params);

    if (!positions.has(key)) {
      positions.set(key, {
        line: rule.source!.start!.line,
        column: rule.source!.start!.column - 1 + '@keyframes '.length,
        length: rule.params.length,
      });
    }
  });

  return positions;
}

async function writeIfChanged(file: string, content: string) {
  const previous = await readFile(file, 'utf8').catch(() => null);

  if (previous !== content) {
    await writeFile(file, content);
  }
}

export async function generateCssModuleTypes(
  config: ResolvedConfig,
  directory = path.join(config.root, 'src'),
) {
  const files = await listFiles(directory);
  const modules = files.filter((file) => file.endsWith('.module.css'));

  for (const file of modules) {
    const css = await readFile(file, 'utf8');
    const compiled = await preprocessCSS(css, file, config);
    const positions = classPositions(css, file);
    const declarationFile = `${file}.d.ts`;
    const mapFile = `${declarationFile}.map`;
    const map = new SourceMapGenerator({
      file: path.basename(declarationFile),
    });
    const lines = [generatedHeader.trimEnd(), 'declare const styles: {'];

    for (const key of Object.keys(compiled.modules ?? {}).sort()) {
      const position = positions.get(key);

      if (!position) {
        throw new Error(`Missing CSS source position for ${key} in ${file}`);
      }

      lines.push(`  readonly ${key}: string;`);
      map.addMapping({
        generated: { line: lines.length, column: 11 },
        original: { line: position.line, column: position.column },
        source: path.basename(file),
      });
      map.addMapping({
        generated: { line: lines.length, column: 11 + key.length },
        original: {
          line: position.line,
          column: position.column + position.length,
        },
        source: path.basename(file),
      });
    }
    lines.push(
      '};',
      'export default styles;',
      `//# sourceMappingURL=${path.basename(mapFile)}`,
      '',
    );
    // TypeScript ignores declaration maps that embed sourcesContent.
    await writeIfChanged(mapFile, `${map.toString()}\n`);
    await writeIfChanged(declarationFile, lines.join('\n'));
  }

  for (const file of files.filter((item) =>
    item.endsWith('.module.css.d.ts'),
  )) {
    const source = file.slice(0, -'.d.ts'.length);
    const declaration = await readFile(file, 'utf8');

    if (!modules.includes(source) && declaration.startsWith(generatedHeader)) {
      await unlink(file);
      await unlink(`${file}.map`).catch((error: NodeJS.ErrnoException) => {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      });
    }
  }
}

export function cssModuleTypesPlugin(): Plugin {
  return {
    name: 'css-module-types',
    async configureServer(server) {
      let pending = Promise.resolve();

      await generateCssModuleTypes(server.config);

      const update = (file: string) => {
        if (!file.endsWith('.module.css')) {
          return;
        }
        pending = pending
          .then(() => generateCssModuleTypes(server.config))
          .catch((error: Error) => server.config.logger.error(error.message));
      };
      const stop = () => {
        server.watcher.off('add', update);
        server.watcher.off('change', update);
        server.watcher.off('unlink', update);
      };

      server.watcher.on('add', update);
      server.watcher.on('change', update);
      server.watcher.on('unlink', update);
      server.httpServer?.once('close', stop);
    },
  };
}
