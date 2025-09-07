export default function SiteFooter() {
	return (
		<footer className="border-t mt-10">
			<div className="container py-6 text-sm opacity-80 flex items-center justify-between">
				<p>All processing happens in your browser.</p>
				<p>© {new Date().getFullYear()} AI Form Coach</p>
			</div>
		</footer>
	);
} 