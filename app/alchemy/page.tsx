// "use client";
// import React from "react";
// import {
//   type UseAuthenticateResult,
//   useAuthenticate,
// } from "@account-kit/react";
 
// // This examples uses email authentication
// // you can also use passkeys if the user has one created
// export default function MyLoginPage() {
//   const { authenticate, isPending } = useAuthenticate();
//   const [email, setEmail] = React.useState("");
 
//   return (
//     <div>
//       <input
//         type="email"
//         value={email}
//         onChange={(e) => setEmail(e.target.value)}
//       />
//       <button onClick={() => authenticate({ type: "email", email })}>
//         Login
//       </button>
//     </div>
//   );
// }