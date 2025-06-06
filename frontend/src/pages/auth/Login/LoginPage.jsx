import { useState } from "react";
import { Link } from "react-router-dom";

import XSvg from "../../../components/svgs/X";
import { useEffect } from "react";


import { MdOutlineMail } from "react-icons/md";
import { MdPassword } from "react-icons/md";
import {useMutation, useQueryClient} from '@tanstack/react-query'
import {toast} from "react-hot-toast";

const LoginPage = () => {
	
	const [formData, setFormData] = useState({
		username: "",
		password: "",
	});
	const queryClient = useQueryClient();
	const {mutate:loginMutation, isError, isPending, error} = useMutation({
		mutationFn: async ({username,password}) => { 
			try {
				const res = await fetch("/api/auth/login", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
		
					},
					body : JSON.stringify({username, password}),
				} );
				
				const data = await res.json();

				if (!res.ok) {
					let message = "Something went wrong";

					if (data.error && typeof data.error === "string") {
						message = data.error;
					} else if (data.error && typeof data.error === "object") {
						message = data.error?.issues?.[0]?.message || JSON.stringify(data.error);
					} else if (data.message) {
						message = data.message;
					}

					throw new Error(message);
				}
				console.log(data);
				return data;

			} catch (error) {
				console.log(error);
				throw error;
			}
		},
		onSuccess: ()=> {
			toast.success("Login Successful!");
			queryClient.invalidateQueries({queryKey: ["authUser"]});
		}
	});
	const handleSubmit = (e) => {
		e.preventDefault();
		loginMutation(formData);
	};

	const handleInputChange = (e) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	useEffect(() => {
		const handleContextMenu = (e) => {
			e.preventDefault();
			toast.error("Right-click is disabled for security reasons.");
			return false;
		};

		const handleKeyDown = (e) => {
			// Disable F12 (Developer Tools)
			if (e.key === 'F12') {
				e.preventDefault();
				toast.error("Developer tools are disabled for security reasons.");
				return false;
			}
			
			// Disable Ctrl+Shift+I (Developer Tools)
			if (e.ctrlKey && e.shiftKey && e.key === 'I') {
				e.preventDefault();
				toast.error("Developer tools are disabled for security reasons.");
				return false;
			}
			
			// Disable Ctrl+Shift+J (Console)
			if (e.ctrlKey && e.shiftKey && e.key === 'J') {
				e.preventDefault();
				toast.error("Console access is disabled for security reasons.");
				return false;
			}
			
			// Disable Ctrl+U (View Source)
			if (e.ctrlKey && e.key === 'u') {
				e.preventDefault();
				toast.error("View source is disabled for security reasons.");
				return false;
			}
			
			// Disable Ctrl+Shift+C (Element Inspector)
			if (e.ctrlKey && e.shiftKey && e.key === 'C') {
				e.preventDefault();
				toast.error("Element inspector is disabled for security reasons.");
				return false;
			}
			
			// Disable Ctrl+A (Select All) - optional
			if (e.ctrlKey && e.key === 'a') {
				e.preventDefault();
				return false;
			}
		};

		const handleSelectStart = (e) => {
			e.preventDefault();
			return false;
		};

		const handleDragStart = (e) => {
			e.preventDefault();
			return false;
		};

		// Add event listeners
		document.addEventListener('contextmenu', handleContextMenu);
		document.addEventListener('keydown', handleKeyDown);
		document.addEventListener('selectstart', handleSelectStart);
		document.addEventListener('dragstart', handleDragStart);

		// Disable text selection via CSS
		document.body.style.userSelect = 'none';
		document.body.style.webkitUserSelect = 'none';
		document.body.style.mozUserSelect = 'none';
		document.body.style.msUserSelect = 'none';

		// Cleanup function
		return () => {
			document.removeEventListener('contextmenu', handleContextMenu);
			document.removeEventListener('keydown', handleKeyDown);
			document.removeEventListener('selectstart', handleSelectStart);
			document.removeEventListener('dragstart', handleDragStart);
			
			// Restore text selection
			document.body.style.userSelect = 'auto';
			document.body.style.webkitUserSelect = 'auto';
			document.body.style.mozUserSelect = 'auto';
			document.body.style.msUserSelect = 'auto';
		};
	}, []);

	return (
		<div className='max-w-screen-xl mx-auto flex h-screen px-10'>
			<div className='flex-1 hidden lg:flex items-center  justify-center'>
				<XSvg className='lg:w-2/3 fill-white' />
			</div>
			<div className='flex-1 flex flex-col justify-center items-center'>
				<form className='flex gap-4 flex-col' onSubmit={handleSubmit}>
					<XSvg className='w-24 lg:hidden fill-white' />
					<h1 className='text-4xl font-extrabold text-white'>{"Let's"} go.</h1>
					<label className='input input-bordered rounded flex items-center gap-2'>
						<MdOutlineMail />
						<input
							type='text'
							className='grow'
							placeholder='username'
							name='username'
							onChange={handleInputChange}
							value={formData.username}
						/>
					</label>

					<label className='input input-bordered rounded flex items-center gap-2'>
						<MdPassword />
						<input
							type='password'
							className='grow'
							placeholder='Password'
							name='password'
							onChange={handleInputChange}
							value={formData.password}
						/>
					</label>
					<p className='text-xs text-gray-500'>
					Don't remember your password?{' '}
					<Link to='/forgot-password' className='text-blue-500 hover:underline'>
						Forgot password?
					</Link>
					</p>
					
					<button className='btn rounded-full btn-primary text-white'>
						{isPending ? "Loading..." : "Login"}</button>
					{isError && <p className='text-red-500'>
						{error.message} </p>}
				</form>
				<div className='flex flex-col gap-2 mt-4'>
					<p className='text-white text-lg'>{"Don't"} have an account?</p>
					<Link to='/signup'>
						<button className='btn rounded-full btn-primary text-white btn-outline w-full'>Sign up</button>
					</Link>
				</div>
			</div>
		</div>
	);
};
export default LoginPage;