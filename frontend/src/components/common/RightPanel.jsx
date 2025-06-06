import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import useFollow from "../../hooks/userfollow";
import RightPanelSkeleton from "../skeletons/RightPanelSkeleton";
import LoadingSpinner from "./LoadingSpinner";
import { useState } from "react";

const RightPanel = () => {
	const { username } = useParams();
	const queryClient = useQueryClient();
	const [loadingStates, setLoadingStates] = useState({});

	const {data:suggestedUsers, isLoading} = useQuery({
		queryKey: ["suggestedUsers"],
		queryFn: async ()=>{
			try {
				const res = await fetch("/api/user/suggested");
				const data = await res.json();
				if(!res.ok){
					throw new Error(data.message || "Something went wrong!");
				}
				return data;
			} catch (error) {
				throw new Error(error.message);
			}
		}
	});

	const {follow} = useFollow();

	const handleFollow = async (userId) => {
		try {
			setLoadingStates(prev => ({ ...prev, [userId]: true }));
			await follow(userId);
			// Wait for the follow action to complete before invalidating queries
			await Promise.all([
				queryClient.invalidateQueries(["suggestedUsers"]),
				queryClient.invalidateQueries(["following", username]),
				queryClient.invalidateQueries(["userProfile", username])
			]);
		} catch (error) {
			console.error("Error following user:", error);
		} finally {
			setLoadingStates(prev => ({ ...prev, [userId]: false }));
		}
	};

	if(suggestedUsers?.length === 0) return <div className="md:w-64 w-0"></div>

	return (
		<div className='hidden lg:block my-4 mx-2'>
			<div className='bg-[#16181C] p-4 rounded-md sticky top-2'>
				<p className='font-bold'>Who to follow</p>
				<div className='flex flex-col gap-4'>
					{/* item */}
					{isLoading && (
						<>
							<RightPanelSkeleton />
							<RightPanelSkeleton />
							<RightPanelSkeleton />
							<RightPanelSkeleton />
						</>
					)}
					{!isLoading &&
						suggestedUsers?.map((user) => (
							<Link
								to={`/profile/${user.username}`}
								className='flex items-center justify-between gap-4'
								key={user._id}
							>
								<div className='flex gap-2 items-center'>
									<div className='avatar'>
										<div className='w-8 rounded-full'>
											<img src={user.profileImg || "/avatar-placeholder.png"} />
										</div>
									</div>
									<div className='flex flex-col'>
										<span className='font-semibold tracking-tight truncate w-28'>
											{user.fullName}
										</span>
										<span className='text-sm text-slate-500'>@{user.username}</span>
									</div>
								</div>
								<div>
									<button
										className='btn bg-white text-black hover:bg-white hover:opacity-90 rounded-full btn-sm'
										onClick={(e) => {
											e.preventDefault();
											handleFollow(user._id);
										}}
									>
										{loadingStates[user._id] ? <LoadingSpinner size="sm"/> : "Follow"}
									</button>
								</div>
							</Link>
						))}
				</div>
			</div>
		</div>
	);
};
export default RightPanel;