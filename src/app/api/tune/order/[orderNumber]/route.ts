import db from '@/db';
import { tuneOrder } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

type CliDiffEntry = {
  key: string;
  before?: string;
  after: string;
  status: 'changed' | 'added';
};

type CliDiffSummary = {
  changed: number;
  added: number;
  unchanged: number;
};

type CliDiffResult = {
  entries: CliDiffEntry[];
  summary: CliDiffSummary;
  warnings: string[];
};

function parseCliSetLines(content: string): Map<string, string> {
  const map = new Map<string, string>();
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('set ')) continue;
    const match = trimmed.match(/^set\s+([a-zA-Z0-9_]+)\s*=\s*(.+)$/);
    if (!match) continue;
    const key = match[1];
    const value = match[2].trim();
    if (key) {
      map.set(key, value);
    }
  }
  return map;
}

function buildCliDiff(
  original: string | null | undefined,
  updated: string | null | undefined
): CliDiffResult {
  const warnings: string[] = [];
  if (!original) warnings.push('missing_cli_dump');
  if (!updated) warnings.push('missing_cli_commands');

  if (!original || !updated) {
    return {
      entries: [],
      summary: { changed: 0, added: 0, unchanged: 0 },
      warnings,
    };
  }

  const originalMap = parseCliSetLines(original);
  const updatedMap = parseCliSetLines(updated);

  if (updatedMap.size === 0) {
    warnings.push('no_changes_detected');
    return {
      entries: [],
      summary: { changed: 0, added: 0, unchanged: 0 },
      warnings,
    };
  }

  const entries: CliDiffEntry[] = [];
  let changed = 0;
  let added = 0;
  let unchanged = 0;

  for (const [key, after] of updatedMap.entries()) {
    const before = originalMap.get(key);
    if (before === undefined) {
      entries.push({ key, after, status: 'added' });
      added += 1;
      continue;
    }
    if (before !== after) {
      entries.push({ key, before, after, status: 'changed' });
      changed += 1;
    } else {
      unchanged += 1;
    }
  }

  if (entries.length === 0) {
    warnings.push('no_changes_detected');
  }

  entries.sort((a, b) => a.key.localeCompare(b.key));

  return {
    entries,
    summary: { changed, added, unchanged },
    warnings,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const { orderNumber } = await params;

    if (!orderNumber) {
      return NextResponse.json(
        { error: 'Order number is required' },
        { status: 400 }
      );
    }

    const [order] = await db
      .select({
        orderNumber: tuneOrder.orderNumber,
        status: tuneOrder.status,
        customerEmail: tuneOrder.customerEmail,
        problems: tuneOrder.problems,
        goals: tuneOrder.goals,
        flyingStyle: tuneOrder.flyingStyle,
        frameSize: tuneOrder.frameSize,
        additionalNotes: tuneOrder.additionalNotes,
        analysisResult: tuneOrder.analysisResult,
        cliCommands: tuneOrder.cliCommands,
        cliDumpContent: tuneOrder.cliDumpContent,
        locale: tuneOrder.locale,
        createdAt: tuneOrder.createdAt,
        completedAt: tuneOrder.completedAt,
      })
      .from(tuneOrder)
      .where(eq(tuneOrder.orderNumber, orderNumber))
      .limit(1);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const analysisResult = order.analysisResult as Record<
      string,
      unknown
    > | null;
    const analysisCliCommands =
      typeof analysisResult?.cli_commands === 'string'
        ? (analysisResult.cli_commands as string)
        : null;
    const cliCommands = order.cliCommands || analysisCliCommands || null;
    const cliDiff = buildCliDiff(order.cliDumpContent, cliCommands);

    return NextResponse.json({
      success: true,
      order: {
        orderNumber: order.orderNumber,
        status: order.status,
        email: order.customerEmail,
        problems: order.problems,
        goals: order.goals,
        flyingStyle: order.flyingStyle,
        frameSize: order.frameSize,
        additionalNotes: order.additionalNotes,
        analysis: order.analysisResult,
        cliCommands,
        cliDiff,
        locale: order.locale,
        createdAt: order.createdAt,
        completedAt: order.completedAt,
      },
    });
  } catch (error) {
    console.error('Order query error:', error);
    return NextResponse.json(
      { error: 'Failed to query order' },
      { status: 500 }
    );
  }
}
