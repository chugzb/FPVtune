import { DEFAULT_MODEL, getBlackboxAnalysisPrompt, openai } from '@/lib/openai';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const blackboxFile = formData.get('blackbox') as File | null;
    const problems = formData.get('problems') as string;
    const goals = formData.get('goals') as string;
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

    // 读取文件内容（前 50KB 用于分析）
    const fileBuffer = await blackboxFile.arrayBuffer();
    const fileContent = new TextDecoder().decode(fileBuffer.slice(0, 50000));

    // 构建 prompt（根据语言）
    const prompt = getBlackboxAnalysisPrompt(locale)
      .replace('{problems}', problems || 'Not specified')
      .replace('{goals}', goals || 'Not specified')
      .replace('{flyingStyle}', flyingStyle || 'Not specified')
      .replace('{frameSize}', frameSize || 'Not specified')
      .replace('{additionalNotes}', additionalNotes || 'None');

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
          content: `Here is the blackbox log data to analyze:\n\n${fileContent}\n\nPlease analyze this data and provide optimized PID settings.`,
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
