'use client';

import { sendMessageAction } from '@/actions/send-message';
import { FormError } from '@/components/shared/form-error';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

/**
 * Contact form card component
 * This is a client component that handles the contact form submission
 */
export function ContactFormCard() {
  const t = useTranslations('ContactPage' as any) as any;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>('');

  // Create a schema for contact form validation
  const nameMinLength = t('form.nameMinLength');
  const nameMaxLength = t('form.nameMaxLength');
  const emailValidation = t('form.emailValidation');
  const messageMinLength = t('form.messageMinLength');
  const messageMaxLength = t('form.messageMaxLength');

  const formSchema = z.object({
    name: z.string().min(3, nameMinLength).max(30, nameMaxLength),
    email: z.string().email(emailValidation),
    message: z.string().min(10, messageMinLength).max(500, messageMaxLength),
  });

  // Form types
  type ContactFormValues = z.infer<typeof formSchema>;

  // Initialize the form
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      message: '',
    },
  });

  // Handle form submission
  const onSubmit = (values: ContactFormValues) => {
    startTransition(async () => {
      try {
        setError('');

        // Submit form data using the contact server action
        const result = await sendMessageAction(values);

        if (result?.data?.success) {
          toast.success(t('form.success' as any));
          form.reset();
        } else {
          const errorMessage = result?.data?.error || t('form.fail' as any);
          setError(errorMessage);
          toast.error(errorMessage);
        }
      } catch (err) {
        console.error('Form submission error:', err);
        setError(t('form.fail' as any));
        toast.error(t('form.fail' as any));
      }
    });
  };

  return (
    <Card className="mx-auto max-w-lg overflow-hidden pt-6 pb-0">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          {t('form.title' as any)}
        </CardTitle>
        <CardDescription>{t('form.description' as any)}</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col">
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.name' as any)}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('form.name' as any)} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.email' as any)}</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder={t('form.email' as any)}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.message' as any)}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('form.message' as any)}
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormError message={error} />
          </CardContent>
          <CardFooter className="mt-6 px-6 py-4 flex justify-between items-center bg-muted rounded-none">
            <Button
              type="submit"
              disabled={isPending}
              className="cursor-pointer"
            >
              {isPending
                ? t('form.submitting' as any)
                : t('form.submit' as any)}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
