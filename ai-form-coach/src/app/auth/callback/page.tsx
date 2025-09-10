"use client";
import { useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function AuthCallback() {
	const router = useRouter();

	useEffect(() => {
		const handleAuthCallback = async () => {
			const supabase = getSupabaseClient();
			
			try {
				const { data, error } = await supabase.auth.getSession();
				
				if (error) {
					console.error('Auth callback error:', error);
					router.push('/signin?error=auth_failed');
					return;
				}

				if (data.session?.user) {
					// Ensure profile exists
					try {
						await supabase.from('profiles').upsert(
							{ id: data.session.user.id },
							{ onConflict: 'id' }
						);
					} catch (profileError) {
						console.error('Profile creation error:', profileError);
					}
					
					// Redirect to coach with welcome flag
					router.push('/coach?welcome=true');
				} else {
					router.push('/signin?error=no_session');
				}
			} catch (err) {
				console.error('Unexpected auth error:', err);
				router.push('/signin?error=unexpected');
			}
		};

		handleAuthCallback();
	}, [router]);

	return (
		<div className="min-h-screen flex items-center justify-center">
			<div className="text-center space-y-4">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
				<p className="text-sm opacity-70">Completing sign in...</p>
			</div>
		</div>
	);
} 