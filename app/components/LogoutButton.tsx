'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleLogout = async () => {
        setIsLoggingOut(true);
        setError(null);
        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Failed to log out.' }));
                throw new Error(errorData.message);
            }

            // On successful logout, redirect to the homepage.
            router.push('/');
            router.refresh();

        } catch (err: any) {
            setError(err.message || 'An unknown error occurred during logout.');
        } finally {
            setIsLoggingOut(false);
        }
    };

    return (
        <div style={{ margin: '10px 0' }}>
            <button onClick={handleLogout} disabled={isLoggingOut}>
                {isLoggingOut ? 'Exiting...' : 'Exit Game'}
            </button>
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    );
}