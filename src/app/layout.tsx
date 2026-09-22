import type { Metadata } from 'next';
import './globals.css';
import { I18nProvider } from '@/components/I18nProvider';

export const metadata: Metadata = {
    title: { default: 'Vy Space | RAGE Script Commands Library', template: '%s | Script Commands Library' },
    description: 'A Reference for script commands across Rockstar\'s RAGE titles.',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className="antialiased">
                <I18nProvider>{children}</I18nProvider>
            </body>
        </html>
    );
}