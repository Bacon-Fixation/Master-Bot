'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '~/components/ui/button';
import { api } from '~/utils/api';
import { env } from '~/env.mjs';

export default function GuildsList() {
	const { data, isLoading, isError } = api.guild.getAll.useQuery(undefined, {
		refetchOnReconnect: false,
		retryOnMount: false,
		refetchOnWindowFocus: false
	});

	if (isLoading) return <div className="text-white">Loading...</div>;

	if (isError) return <div className="text-white">Error</div>;

	return (
		<>
			{data ? (
				<div className="flex gap-4 w-max v-max">
					{data.apiGuilds.map(guild => (
						<div
							className="text-white flex flex-col items-center border-4 border-slate-800 rounded-2xl shadow-xl shadow-slate-950"
							key={guild.id}
						>
							<div className="max-w-xs rounded-2xl">
								<Image
									src={
										guild.icon
											? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`
											: 'https://cdn.discordapp.com/embed/avatars/2.png'
									}
									alt="banner"
									width="52"
									height="52"
									className="rounded-xl w-52"
								></Image>
							</div>
							<div className=" flex flex-col items-center bg-slate-800 min-w-full ">
								<p className="font-semibold text-lg">{guild.name}</p>
								{data.dbGuildsIds.includes(guild.id) ? (
									<Button
										className="bg-orange-500 hover:bg-orange-600 text-white shadow-xl shadow-slate-950"
										asChild
									>
										<Link href={`/dashboard/${guild.id}`}>Manage</Link>
									</Button>
								) : (
									<Button variant="link" asChild>
										<a
											className="px-6 py-3 bg-blue-900 rounded-md hover:bg-blue-700 shadow-xl shadow-slate-950"
											href={
												env.NEXT_PUBLIC_INVITE_URL +
												`&disable_guild_select=true&guild_id=${guild.id}`
											}
											target="_blank"
											rel="noreferrer"
										>
											Invite
										</a>
									</Button>
								)}
							</div>
						</div>
					))}
				</div>
			) : (
				<div>
					<p className="text-white">You do not own a Discord server</p>
				</div>
			)}
		</>
	);
}
