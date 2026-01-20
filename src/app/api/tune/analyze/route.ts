import { DEFAULT_MODEL, getBlackboxAnalysisPrompt, openai } from '@/lib/openai';
import {
  FRAME_NAMES,
  GOAL_NAMES,
  PROBLEM_NAMES,
  STYLE_NAMES,
  getNameById,
  mapIdsToNames,
} from '@/lib/tune/mappings';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const blackboxFile = formData.get('blackbox') as File | null;
    const cliDumpFile = formData.get('cliDump') as File | null;
    const problems = formData.get('problems') as string;
    const goals = formData.get('goals') as string;
    const customGoal = formData.get('customGoal') as string;
    const flyingStyle = formData.get('flyingStyle') as string;
    const frameSize = formData.get('frameSize') as string;
    const additionalNotes = formData.get('additionalNotes') as string;
    const locale = (formData.get('locale') as string) || 'en';

    if (!blackboxFile) {
      return NextResponse.json(
        { error: 'Blackbox file is required' },
        { status: 400 }
      );
    }

    // 读取完整 blackbox 文件内容
    const fileBuffer = await blackboxFile.arrayBuffer();
    const fileContent = new TextDecoder().decode(fileBuffer);

    // 读取 CLI dump 文件内容（如果有）
    let cliDumpContent = '';
    if (cliDumpFile) {
      const cliBuffer = await cliDumpFile.arrayBuffer();
      cliDumpContent = new TextDecoder().decode(cliBuffer);
    }

    // 将 ID 转换为可读名称
    const problemNames = mapIdsToNames(problems, PROBLEM_NAMES, locale);
    const goalNames = mapIdsToNames(goals, GOAL_NAMES, locale);
    const styleName = getNameById(flyingStyle, STYLE_NAMES, locale);
    const frameName = getNameById(frameSize, FRAME_NAMES, locale);

    // 合并目标（包括自定义目标）
    const allGoals = customGoal ? `${goalNames}, ${customGoal}` : goalNames;

    // 构建 prompt（根据语言）
    const prompt = getBlackboxAnalysisPrompt(locale)
      .replace('{problems}', problemNames)
      .replace('{goals}', allGoals)
      .replace('{flyingStyle}', styleName)
      .replace('{frameSize}', frameName)
      .replace('{additionalNotes}', additionalNotes || 'None');

    // 构建用户消息，包含 blackbox 和 CLI dump 数据
    let userMessage = `Here is the blackbox log data to analyze:\n\n${fileContent}`;
    if (cliDumpContent) {
      userMessage += `\n\n--- Current CLI Settings (diff output) ---\n${cliDumpContent}`;
    }
    userMessage +=
      '\n\nPlease analyze this data and provide optimized PID settings.';

    console.log('OpenAI Request - Problems:', problemNames);
    console.log('OpenAI Request - Goals:', allGoals);
    console.log('OpenAI Request - Style:', styleName);
    console.log('OpenAI Request - Frame:', frameName);
    console.log('OpenAI Request - CLI Dump included:', !!cliDumpContent);

    // 调用 GPT-5.1 分析
    const completion = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: 'system',
          content: prompt,
        },
        {
          role: 'user',
          content: userMessage,
        },
      ],
      temperature: 0.3,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    });

    const result = completion.choices[0]?.message?.content;

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to generate analysis' },
        { status: 500 }
      );
    }

    // 解析 JSON 响应
    const analysis = JSON.parse(result);

    return NextResponse.json({
      success: true,
      analysis,
      model: DEFAULT_MODEL,
      usage: completion.usage,
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze blackbox data' },
      { status: 500 }
    );
  }
}
