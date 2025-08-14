import React, { useState } from 'react';
export default function RegisterPage(){
  const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [confirm,setConfirm]=useState('');
  const submit=e=>{e.preventDefault(); if(password!==confirm){alert('Passwords do not match'); return;}
    console.log('Register:',{email,password}); };
  return (<div className="p-6 max-w-md mx-auto">
    <h2 className="text-2xl font-bold mb-4">Create your account</h2>
    <form onSubmit={submit} className="space-y-3">
      <input className="w-full border rounded px-3 py-2" type="email" placeholder="Email"
             value={email} onChange={e=>setEmail(e.target.value)} />
      <input className="w-full border rounded px-3 py-2" type="password" placeholder="Password"
             value={password} onChange={e=>setPassword(e.target.value)} />
      <input className="w-full border rounded px-3 py-2" type="password" placeholder="Confirm Password"
             value={confirm} onChange={e=>setConfirm(e.target.value)} />
      <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded px-3 py-2">Register</button>
    </form>
  </div>);
}
