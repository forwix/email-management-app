import React, { useState } from 'react';
export default function LoginPage(){
  const [email,setEmail]=useState(''); const [password,setPassword]=useState('');
  const onSubmit=e=>{e.preventDefault(); console.log('Login:',{email,password});};
  return (<div className="p-6 max-w-md mx-auto">
    <h2 className="text-2xl font-bold mb-4">Sign in</h2>
    <form onSubmit={onSubmit} className="space-y-3">
      <input className="w-full border rounded px-3 py-2" type="email" placeholder="Email"
             value={email} onChange={e=>setEmail(e.target.value)} />
      <input className="w-full border rounded px-3 py-2" type="password" placeholder="Password"
             value={password} onChange={e=>setPassword(e.target.value)} />
      <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded px-3 py-2">Login</button>
    </form>
  </div>);
}
