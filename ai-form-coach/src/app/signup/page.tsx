import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SignUp() {
	const router = useRouter();
	
	useEffect(() => {
		// Redirect to signin page since we now handle both signin/signup there
		router.push('/signin');
	}, [router]);

	return null;
} 