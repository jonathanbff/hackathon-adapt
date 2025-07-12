import Link from "next/link";

import { HydrateClient, api } from "~/trpc/server";

export default async function Home() {
	const hello = await api.post.hello({ text: "from tRPC" });

	void api.post.getLatest.prefetch();

	return (
		<HydrateClient>
			<div className="flex flex-col items-center justify-center">
				<div className="container flex flex-col items-center justify-center gap-12 px-4 py-8">
					<h1 className="font-extrabold text-4xl tracking-tight text-center">
						Welcome to <span className="text-primary">Edu One</span>
					</h1>
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
						<Link
							className="flex max-w-xs flex-col gap-4 rounded-xl border p-4 shadow-sm transition-shadow hover:shadow-md"
							href="https://create.t3.gg/en/usage/first-steps"
							target="_blank"
						>
							<h3 className="font-bold text-2xl">First Steps →</h3>
							<div className="text-lg text-muted-foreground">
								Just the basics - Everything you need to know to set up your
								database and authentication.
							</div>
						</Link>
						<Link
							className="flex max-w-xs flex-col gap-4 rounded-xl border p-4 shadow-sm transition-shadow hover:shadow-md"
							href="https://create.t3.gg/en/introduction"
							target="_blank"
						>
							<h3 className="font-bold text-2xl">Documentation →</h3>
							<div className="text-lg text-muted-foreground">
								Learn more about Create T3 App, the libraries it uses, and how
								to deploy it.
							</div>
						</Link>
					</div>
					<div className="flex flex-col items-center gap-2">
						<p className="text-2xl">
							{hello ? hello.greeting : "Loading tRPC query..."}
						</p>
					</div>
				</div>
			</div>
		</HydrateClient>
	);
}
