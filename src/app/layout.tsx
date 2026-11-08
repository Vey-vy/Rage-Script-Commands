import type { Metadata } from 'next';
import './globals.css';
import { I18nProvider } from '@/components/I18nProvider';
import { NewsPopup } from '@/components/NewsPopup';
import { getLatestNews, type NewsAnnouncement } from '@/lib/news';

export const metadata: Metadata = {
    title: { default: 'Vy Space | RAGE Script Commands Library', template: '%s | Script Commands Library' },
    description: 'A Reference for script commands across Rockstar\'s RAGE titles.',
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    let news: NewsAnnouncement | null = null;

    try {
        news = await getLatestNews();
    } catch (error) {
        console.error('[NEWS] Could not fetch the latest news.', error);
    }

    return (
        <html lang="en">
            <body className="antialiased">
                <I18nProvider>
                    {children}
                    <NewsPopup news={news} />
                </I18nProvider>
            </body>
        </html>
    );
}