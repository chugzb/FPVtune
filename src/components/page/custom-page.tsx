import { CustomMDXContent } from '@/components/shared/custom-mdx-content';
import { formatDate } from '@/lib/formatter';
import type { Page } from 'content-collections';
import { CalendarIcon } from 'lucide-react';
import { Card, CardContent } from '../ui/card';

interface CustomPageProps {
  page: Page;
}

export function CustomPage({ page }: CustomPageProps) {
  const formattedDate = formatDate(new Date(page.date));

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-12 px-4">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-center text-3xl font-bold tracking-tight">
          {page.title}
        </h1>
        <p className="text-center text-lg text-muted-foreground">
          {page.description}
        </p>
        <div className="flex items-center justify-center gap-2">
          <CalendarIcon className="size-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{formattedDate}</p>
        </div>
      </div>

      {/* Content */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="max-w-none prose prose-neutral dark:prose-invert prose-img:rounded-lg">
            <CustomMDXContent
              code={page.body}
              includeFumadocsComponents={false}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
