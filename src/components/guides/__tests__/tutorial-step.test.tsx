import { render, screen } from '@testing-library/react';
import { TutorialStep } from '../tutorial-step';

describe('TutorialStep', () => {
  it('renders step number and title', () => {
    render(
      <TutorialStep number={1} title="测试步骤">
        <p>步骤内容</p>
      </TutorialStep>
    );

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('测试步骤')).toBeInTheDocument();
    expect(screen.getByText('步骤内容')).toBeInTheDocument();
  });

  it('renders with correct data attributes', () => {
    const { container } = render(
      <TutorialStep number={2} title="测试步骤">
        <p>内容</p>
      </TutorialStep>
    );

    const stepElement = container.querySelector('[data-step="2"]');
    expect(stepElement).toBeInTheDocument();
    expect(stepElement).toHaveAttribute('data-quick-only', 'false');
  });

  it('supports isQuickOnly prop', () => {
    const { container } = render(
      <TutorialStep number={3} title="快速参考步骤" isQuickOnly={true}>
        <p>快速参考内容</p>
      </TutorialStep>
    );

    const stepElement = container.querySelector('[data-step="3"]');
    expect(stepElement).toHaveAttribute('data-quick-only', 'true');
  });

  it('renders children content', () => {
    render(
      <TutorialStep number={1} title="测试">
        <div>
          <p>段落 1</p>
          <p>段落 2</p>
          <code>代码示例</code>
        </div>
      </TutorialStep>
    );

    expect(screen.getByText('段落 1')).toBeInTheDocument();
    expect(screen.getByText('段落 2')).toBeInTheDocument();
    expect(screen.getByText('代码示例')).toBeInTheDocument();
  });

  it('applies correct styling classes', () => {
    const { container } = render(
      <TutorialStep number={1} title="测试">
        <p>内容</p>
      </TutorialStep>
    );

    const stepElement = container.querySelector('[data-step="1"]');
    expect(stepElement).toHaveClass(
      'mb-8',
      'pb-8',
      'border-b',
      'border-white/10'
    );
  });

  it('renders step number badge with correct styling', () => {
    const { container } = render(
      <TutorialStep number={5} title="测试">
        <p>内容</p>
      </TutorialStep>
    );

    const badge = screen.getByText('5');
    expect(badge).toHaveClass(
      'w-10',
      'h-10',
      'rounded-full',
      'bg-blue-500',
      'flex',
      'items-center',
      'justify-center',
      'font-bold',
      'flex-shrink-0'
    );
  });
});
