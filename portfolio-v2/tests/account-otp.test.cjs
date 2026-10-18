const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
function setup(){
 let email='owner@example.com',token='session',allowed=true,aal='aal1',nextAal='aal1',writes=0;const verified=[];
 class SupabaseService{}class ApiConfigService{};
 const auth={getUser:async()=>({data:{user:{id:'owner',email}}}),getSession:async()=>({data:{session:{access_token:token}}}),signInWithOtp:async()=>({}),updateUser:async change=>{writes++;return {};},verifyOtp:async args=>{verified.push(args);if(args.type==='email_change'&&args.email!=='owner@example.com')email=args.email;return {data:{user:{id:'owner',email}}};},signOut:async()=>({}),mfa:{getAuthenticatorAssuranceLevel:async()=>({data:{currentLevel:aal,nextLevel:nextAal}})}};
 const proofAuth={verifyOtp:async()=>({data:{user:{id:'owner'}}}),signOut:async()=>({})};
 const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/app/core/account-otp.service.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,experimentalDecorators:true}}).outputText,{exports,location:{origin:'https://portfolio.example'},require:name=>name==='@angular/core'?{Injectable:()=>()=>{},inject:type=>type===SupabaseService?{client:{auth},rpc:async()=>allowed}:{supabaseUrl:'https://example.supabase.co',supabasePublishableKey:'public'}}:name==='@supabase/supabase-js'?{createClient:()=>({auth:proofAuth})}:name==='./supabase.service'?{SupabaseService}:name==='./api-config.service'?{ApiConfigService}:null});
 return {service:new exports.AccountOtpService(),verified,setAllowed:v=>allowed=v,setMfa:()=>nextAal='aal2',writes:()=>writes};
}
test('email change requires current-address proof and confirms each address with its own OTP',async()=>{
 const t=setup();await assert.rejects(t.service.requestNewEmail('new@example.com'),/Verify your current email first/);assert.equal(t.writes(),0);
 await t.service.verifyCurrentCode('owner@example.com','12345678');await t.service.requestNewEmail('new@example.com');
 await t.service.confirmEmailCode('new@example.com','23456789');await t.service.confirmEmailCode('new@example.com','34567890',true);
 assert.deepEqual(t.verified.map(call=>call.email),['owner@example.com','new@example.com']);
});
test('recovery refuses password updates before OTP and admin verification',async()=>{
 const t=setup();await assert.rejects(t.service.completeRecovery('New password is long'),/Verify your recovery code again/);assert.equal(t.writes(),0);
 t.setAllowed(false);await assert.rejects(t.service.verifyRecovery('owner@example.com','12345678'),/authorized admin/);assert.equal(t.writes(),0);
});
test('recovery keeps enrolled MFA in the verification flow',async()=>{
 const t=setup();t.setMfa();assert.equal(await t.service.verifyRecovery('owner@example.com','12345678'),'mfa');
 await assert.rejects(t.service.completeRecovery('New password is long'),/Verify your recovery code again/);assert.equal(t.writes(),0);
});

test('recovery links use the same admin and MFA gates as OTP codes',async()=>{
 const t=setup();await assert.rejects(t.service.verifyRecoveryLink('not-a-token'),/Invalid recovery link/);assert.equal(t.verified.length,0);
 assert.equal(await t.service.verifyRecoveryLink('a'.repeat(64)),'password');assert.equal(t.verified[0].type,'recovery');assert.equal(t.verified[0].token_hash,'a'.repeat(64));
 t.setAllowed(false);await assert.rejects(t.service.verifyRecoveryLink('b'.repeat(64)),/authorized admin/);
});
