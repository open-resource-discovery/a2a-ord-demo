import { describe, it, snapshot } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const DEMO = path.resolve(import.meta.dirname);
const ROOT = path.resolve(DEMO, '..');

describe('demo.sh', () => {
  const scriptPath = path.join(DEMO, 'demo.sh');

  it('should exist', () => {
    assert.ok(fs.existsSync(scriptPath), 'demo.sh does not exist');
  });

  it('should be executable', () => {
    const stat = fs.statSync(scriptPath);
    const isExecutable = (stat.mode & 0o111) !== 0;
    assert.ok(isExecutable, 'demo.sh is not executable');
  });

  it('should have valid bash syntax', () => {
    const result = execSync(`bash -n "${scriptPath}" 2>&1`, { encoding: 'utf-8' });
    assert.strictEqual(result, '', 'demo.sh has syntax errors');
  });

  it('should support "down" argument', () => {
    const content = fs.readFileSync(scriptPath, 'utf-8');
    assert.ok(content.includes('down'), 'demo.sh does not handle "down" argument');
    assert.ok(content.includes('docker compose'), 'demo.sh does not call docker compose');
  });

  it('should start services with docker compose', () => {
    const content = fs.readFileSync(scriptPath, 'utf-8');
    assert.ok(content.includes('docker compose'), 'demo.sh does not call docker compose');
    assert.ok(content.includes('up'), 'demo.sh does not call docker compose up');
  });

  it('should wait for healthy services', () => {
    const content = fs.readFileSync(scriptPath, 'utf-8');
    assert.ok(content.includes('healthy'), 'demo.sh does not wait for healthy services');
  });

  it('should print service URLs', () => {
    const content = fs.readFileSync(scriptPath, 'utf-8');
    assert.ok(content.includes('localhost:3001'), 'demo.sh does not print spaceship-app URL');
    assert.ok(content.includes('localhost:3002'), 'demo.sh does not print super-agent URL');
  });
});

describe('demo.http', () => {
  const httpPath = path.join(DEMO, 'demo.http');
  let content;

  it('should exist', () => {
    assert.ok(fs.existsSync(httpPath), 'demo.http does not exist');
  });

  it('should define spaceship variable', () => {
    content = fs.readFileSync(httpPath, 'utf-8');
    assert.ok(content.includes('@spaceship'), 'demo.http missing @spaceship variable');
    assert.ok(content.includes('localhost:3001'), 'demo.http missing spaceship-app URL');
  });

  it('should chain ORD → Agent Card → A2A', () => {
    content = fs.readFileSync(httpPath, 'utf-8');
    assert.ok(content.includes('.well-known/open-resource-discovery'), 'missing ORD well-known');
    assert.ok(content.includes('{{ordDocPath}}'), 'missing chained ORD document');
    assert.ok(content.includes('agent.json'), 'missing Agent Card fetch');
    assert.ok(content.includes('POST {{spaceship}}/repair') || content.includes('POST {{spaceship}}/solar'), 'missing A2A call to agent base path');
  });

  it('should extract variables from responses using @name', () => {
    content = fs.readFileSync(httpPath, 'utf-8');
    const names = content.match(/# @name \w+/g) || [];
    assert.ok(names.length >= 6, `should have at least 6 @name annotations, found ${names.length}`);
  });

  it('should have A2A message/send call', () => {
    content = fs.readFileSync(httpPath, 'utf-8');
    assert.ok(content.includes('message/send'), 'missing A2A message/send method');
    assert.ok(content.includes('"jsonrpc": "2.0"'), 'missing JSON-RPC envelope');
  });

  it('should use ### separators between requests', () => {
    content = fs.readFileSync(httpPath, 'utf-8');
    const separators = content.match(/^###/gm);
    assert.ok(separators && separators.length >= 7, `should have at least 7 separators, found ${separators?.length ?? 0}`);
  });

  it('should tell a discovery story (ORD before A2A)', () => {
    content = fs.readFileSync(httpPath, 'utf-8');
    const ordIdx = content.indexOf('.well-known/open-resource-discovery');
    const a2aIdx = content.indexOf('message/send');
    assert.ok(ordIdx < a2aIdx, 'ORD should come before A2A');
  });

  it('should include commander section', () => {
    content = fs.readFileSync(httpPath, 'utf-8');
    assert.ok(content.includes('@commander'), 'demo.http missing @commander variable');
    assert.ok(content.includes('commanderCard'), 'demo.http missing commander card request');
  });

  it('should include Super Agent ORD discovery', () => {
    content = fs.readFileSync(httpPath, 'utf-8');
    assert.ok(content.includes('@ordProviderSuper'), 'demo.http missing @ordProviderSuper variable');
    assert.ok(content.includes('localhost:3004'), 'demo.http missing super agent ORD provider URL');
    assert.ok(content.includes('ordDocumentSuper'), 'demo.http missing super agent ORD document request');
  });

  it('should match snapshot', (t) => {
    content = fs.readFileSync(httpPath, 'utf-8');
    t.assert.snapshot(content);
  });

  it('should include A2A Editor Playground section', () => {
    content = fs.readFileSync(httpPath, 'utf-8');
    assert.ok(content.includes('A2A Editor'), 'demo.http missing A2A Editor section');
  });
});
