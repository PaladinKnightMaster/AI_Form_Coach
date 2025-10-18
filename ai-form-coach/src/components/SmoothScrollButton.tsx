"use client";

interface SmoothScrollButtonProps {
	targetId: string;
	children: React.ReactNode;
}

export default function SmoothScrollButton({ targetId, children }: SmoothScrollButtonProps) {
	const handleClick = () => {
		document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
	};

	return (
		<button className="btn btn-secondary" onClick={handleClick}>
			{children}
		</button>
	);
}
