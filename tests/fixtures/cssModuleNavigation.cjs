const { spawn } = require('node:child_process');
const { readFileSync } = require('node:fs');
const path = require('node:path');

const directory = process.cwd();
const file = path.join(directory, 'src/components/cssNavigationProbe.ts');
const source = [
  "import styles from './GameLogView.module.css';",
  "import cardStyles from './Card.module.css';",
  'styles.gameLogReadable;',
  'cardStyles.cardTypeName;',
  'styles.thisClassDoesNotExist;',
].join('\n');
const server = spawn(
  process.execPath,
  [require.resolve('typescript/lib/tsserver.js')],
  {
    stdio: ['pipe', 'pipe', 'pipe'],
  },
);
const requests = new Map();
let sequence = 0;
let buffer = '';

server.stdout.setEncoding('utf8');
server.stdout.on('data', (chunk) => {
  buffer += chunk;

  while (buffer.includes('\r\n\r\n')) {
    const end = buffer.indexOf('\r\n\r\n');
    const header = buffer.slice(0, end);
    const length = Number(/Content-Length: (\d+)/.exec(header)?.[1]);

    if (!length || Buffer.byteLength(buffer.slice(end + 4)) < length) {
      break;
    }

    const bytes = Buffer.from(buffer.slice(end + 4));
    const message = JSON.parse(bytes.subarray(0, length).toString());

    buffer = bytes.subarray(length).toString();
    if (message.type === 'response') {
      const pending = requests.get(message.request_seq);

      requests.delete(message.request_seq);
      if (message.success) {
        pending?.resolve(message.body);
      } else {
        pending?.reject(new Error(message.message));
      }
    }
  }
});
server.on('exit', (code) => {
  for (const pending of requests.values()) {
    pending.reject(new Error(`TypeScript server exited with code ${code}`));
  }
});

function request(command, args) {
  const seq = ++sequence;

  return new Promise((resolve, reject) => {
    requests.set(seq, { resolve, reject });
    server.stdin.write(
      `${JSON.stringify({ seq, type: 'request', command, arguments: args })}\n`,
    );
  });
}

async function checkNavigation() {
  await request('open', {
    file,
    fileContent: source,
    projectRootPath: directory,
  });

  const definitions = [];

  for (const name of ['gameLogReadable', 'cardTypeName']) {
    const before = source.slice(0, source.indexOf(name));
    const lines = before.split('\n');
    const response = await request('definitionAndBoundSpan', {
      file,
      line: lines.length,
      offset: lines.at(-1).length + 1,
    });
    const definition = response.definitions[0];

    if (!definition) {
      throw new Error(`Missing CSS definition for ${name}`);
    }

    definitions.push({
      name,
      file: path.relative(directory, definition.file),
      cssLine: readFileSync(definition.file, 'utf8')
        .split('\n')
        [definition.start.line - 1].trim(),
      cssClass: readFileSync(definition.file, 'utf8')
        .split('\n')
        [definition.start.line - 1].slice(
          definition.start.offset - 1,
          definition.end.offset - 1,
        ),
    });
  }

  const diagnostics = await request('semanticDiagnosticsSync', { file });

  process.stdout.write(JSON.stringify({ definitions, diagnostics }));
}

checkNavigation()
  .catch((error) => {
    process.stderr.write(String(error));
    process.exitCode = 1;
  })
  .finally(() => server.kill());
