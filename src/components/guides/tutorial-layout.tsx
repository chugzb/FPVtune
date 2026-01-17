import { Breadcrumb } from './breadcrumb';

interface TutorialLayoutProps {
  title: string;
  description: string;
  breadcrumbs: Array<{ label: string; href?: string }>;
  children: React.ReactNode;
}

export function TutorialLayout({
  title,
  description,
  breadcrumbs,
  children,
}: TutorialLayoutProps) {
  return (
    <div className="min-h-screen bg-[#030304] text-white">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <Breadcrumb items={breadcrumbs} />

        <div className="mt-6 mb-8">
          <h1 className="text-4xl font-bold mb-3">{title}</h1>
          <p className="text-gray-400 text-lg">{description}</p>
        </div>

        <div className="tutorial-content">{children}</div>
      </div>
    </div>
  );
}
