#!/usr/bin/env node
/**
 * TodoFlow MCP Server
 * Kiro University Build-Along
 *
 * A minimal Model Context Protocol server that exposes
 * TodoFlow project information and task statistics to Kiro.
 *
 * Protocol: JSON-RPC 2.0 over stdio (MCP spec)
 * Run: node mcp-server/todoflow-mcp.js
 *
 * Tools exposed:
 *   - get_project_info     : Returns app name, version, stack
 *   - get_test_status      : Runs property tests and returns pass/fail
 *   - get_task_statistics  : Parses localStorage export file for stats
 */

'use strict';

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const PROJECT_ROOT = path.resolve(__dirname, '..');

/* =========================================
   MCP SERVER IMPLEMENTATION
   ========================================= */

const SERVER_INFO = {
  name: 'todoflow-mcp',
  version: '1.0.0',
};

const TOOLS = [
  {
    name: 'get_project_info',
    description: 'Returns TodoFlow project metadata: name, version, tech stack, and file listing.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_test_status',
    description: 'Runs the TodoFlow property-based test suite and returns pass/fail results.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_task_statistics',
    description: 'Returns task statistics from a tasks export JSON file. Pass a file path, or uses the sample if omitted.',
    inputSchema: {
      type: 'object',
      properties: {
        filePath: {
          type: 'string',
          description: 'Absolute path to a JSON file containing an array of TodoFlow tasks. Optional.',
        },
      },
      required: [],
    },
  },
];

/* =========================================
   TOOL IMPLEMENTATIONS
   ========================================= */

function getProjectInfo() {
  const pkg = JSON.parse(
    fs.readFileSync(path.join(PROJECT_ROOT, 'package.json'), 'utf8')
  );
  const files = fs.readdirSync(PROJECT_ROOT)
    .filter(f => !f.startsWith('.') && f !== 'node_modules')
    .sort();

  return {
    name: 'TodoFlow',
    version: pkg.version,
    description: 'Kiro University Build-Along — client-side To-Do list web application',
    stack: ['HTML5', 'CSS3', 'Vanilla JavaScript', 'localStorage', 'No backend'],
    repository: pkg.repository && pkg.repository.url,
    projectFiles: files,
    kiroFeatures: [
      'Spec-driven development (.kiro/specs/)',
      'Steering documents (.kiro/steering/)',
      'Hooks (.kiro/hooks/)',
      'Property-based testing (tests/property.test.js)',
      'MCP server (mcp-server/todoflow-mcp.js)',
      'Custom agent (.kiro/agents/todo-qa-agent.md)',
    ],
  };
}

function getTestStatus() {
  try {
    const output = execSync('node tests/property.test.js 2>&1', {
      cwd: PROJECT_ROOT,
      timeout: 30000,
      encoding: 'utf8',
    });

    const passMatch = output.match(/(\d+) passed/);
    const failMatch = output.match(/(\d+) failed/);
    const passed = passMatch ? parseInt(passMatch[1], 10) : 0;
    const failed = failMatch ? parseInt(failMatch[1], 10) : 0;

    return {
      status: failed === 0 ? 'PASS' : 'FAIL',
      passed,
      failed,
      total: passed + failed,
      output: output.slice(-800), // last 800 chars
    };
  } catch (err) {
    return {
      status: 'ERROR',
      error: err.message,
      output: err.stdout || '',
    };
  }
}

function getTaskStatistics(filePath) {
  let tasks = [];

  if (filePath && fs.existsSync(filePath)) {
    try {
      tasks = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
      return { error: `Could not parse file: ${e.message}` };
    }
  } else {
    // Return a descriptive message if no file provided
    return {
      note: 'No tasks file provided. Export tasks from the browser console with: ' +
            'JSON.stringify(JSON.parse(localStorage.getItem("todoflow_tasks")||"[]"))',
      tip: 'Save the output to a .json file and pass its path to this tool.',
      example: 'get_task_statistics({ filePath: "/path/to/tasks.json" })',
    };
  }

  if (!Array.isArray(tasks)) {
    return { error: 'File does not contain a JSON array of tasks' };
  }

  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const active = total - completed;
  const byPriority = { low: 0, medium: 0, high: 0 };
  const overdue = [];
  const today = new Date().toISOString().slice(0, 10);

  tasks.forEach(t => {
    if (byPriority[t.priority] !== undefined) byPriority[t.priority]++;
    if (t.dueDate && t.dueDate < today && !t.completed) {
      overdue.push({ id: t.id, text: t.text, dueDate: t.dueDate });
    }
  });

  return {
    total,
    active,
    completed,
    completionRate: total > 0 ? `${Math.round((completed / total) * 100)}%` : '0%',
    byPriority,
    overdueCount: overdue.length,
    overdueTasks: overdue,
  };
}

/* =========================================
   JSON-RPC 2.0 OVER STDIO
   ========================================= */

function sendResponse(id, result) {
  const msg = JSON.stringify({ jsonrpc: '2.0', id, result });
  process.stdout.write(msg + '\n');
}

function sendError(id, code, message) {
  const msg = JSON.stringify({
    jsonrpc: '2.0',
    id,
    error: { code, message },
  });
  process.stdout.write(msg + '\n');
}

function handleRequest(req) {
  const { id, method, params } = req;

  if (method === 'initialize') {
    return sendResponse(id, {
      protocolVersion: '2024-11-05',
      capabilities: { tools: {} },
      serverInfo: SERVER_INFO,
    });
  }

  if (method === 'tools/list') {
    return sendResponse(id, { tools: TOOLS });
  }

  if (method === 'tools/call') {
    const { name, arguments: args = {} } = params || {};

    if (name === 'get_project_info') {
      return sendResponse(id, {
        content: [{ type: 'text', text: JSON.stringify(getProjectInfo(), null, 2) }],
      });
    }

    if (name === 'get_test_status') {
      return sendResponse(id, {
        content: [{ type: 'text', text: JSON.stringify(getTestStatus(), null, 2) }],
      });
    }

    if (name === 'get_task_statistics') {
      return sendResponse(id, {
        content: [{ type: 'text', text: JSON.stringify(getTaskStatistics(args.filePath), null, 2) }],
      });
    }

    return sendError(id, -32601, `Unknown tool: ${name}`);
  }

  // notifications (id is null) — ignore
  if (id === null || id === undefined) return;

  return sendError(id, -32601, `Method not found: ${method}`);
}

/* =========================================
   STDIO LOOP
   ========================================= */

let buffer = '';

process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  buffer += chunk;
  const lines = buffer.split('\n');
  buffer = lines.pop(); // keep incomplete line
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const req = JSON.parse(trimmed);
      handleRequest(req);
    } catch (e) {
      process.stderr.write(`[todoflow-mcp] Parse error: ${e.message}\n`);
    }
  }
});

process.stdin.on('end', () => process.exit(0));

process.stderr.write('[todoflow-mcp] TodoFlow MCP server started\n');
