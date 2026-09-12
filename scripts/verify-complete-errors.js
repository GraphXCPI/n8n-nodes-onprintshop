const assert=require('node:assert/strict');
const {completeApiError}=require('../dist/nodes/OnPrintShopSafeError');
const secret='fixture-secret-must-not-leak';
const cases=[
 [{message:`GraphQL error: [{"extensions":{"code":"DATA_NOT_FOUND"},"message":"${secret}"}]`},'DATA_NOT_FOUND',false],
 [{httpCode:401,message:secret},'OPS_AUTH',false],
 [{statusCode:403,message:secret},'OPS_PERMISSION',false],
 ...[408,429,500,502,503,504].map(httpCode=>[{httpCode,message:secret},'OPS_TRANSPORT',true]),
 [{message:`Cannot query field ${secret}`},'OPS_SCHEMA',false],
 [{message:`INVALID_USER_INPUT ${secret}`},'OPS_VALIDATION',false],
 [{code:'ECONNRESET',message:secret},'OPS_TRANSPORT',true],
 [{message:secret},'OPS_UNKNOWN',false],
];
for(const [error,code,retryable] of cases){const actual=completeApiError(error);assert.equal(actual.code,code);assert.equal(actual.retryable,retryable);assert(!JSON.stringify(actual).includes(secret));}
async function main(){
 const {safeOnPrintShopRequestError}=require('../dist/nodes/OnPrintShopTokenManager');
 for(const code of ['ECONNRESET','ETIMEDOUT','ECONNREFUSED','ENOTFOUND','EAI_AGAIN']){
  const sanitized=safeOnPrintShopRequestError(Object.assign(new Error(secret),{code}));
  assert.equal(completeApiError(sanitized).code,'OPS_TRANSPORT');
  assert(!JSON.stringify(sanitized).includes(secret));
 }
 const {executeCompleteApi}=require('../dist/nodes/OnPrintShopCompleteApi');
 let executionCases=0;
 for(const statusCode of [400,401,403,429,502,503]){
  const expected=statusCode===401?'OPS_AUTH':statusCode===403?'OPS_PERMISSION':[429,502,503].includes(statusCode)?'OPS_TRANSPORT':'OPS_VALIDATION';
  const params={resource:'apiContract',operation:'customers',apiInputMode:'fields',apiOptional:{},apiReturnMode:'custom',apiReturnFields:['customers.userid']};
  const ctx={getInputData:()=>[{json:{}},{json:{}}],getNode:()=>({name:'Fixture',type:'n8n-nodes-onprintshop.onPrintShopCustomers',parameters:params}),getNodeParameter:(key,index,fallback)=>params[key]??fallback,continueOnFail:()=>true,getCredentials:async()=>({baseUrl:'https://example.invalid',tokenUrl:'https://example.invalid/token',clientId:secret,clientSecret:secret}),helpers:{httpRequest:async options=>{
   if(options.url.endsWith('/token'))return{access_token:secret,expires_in:3600};
   throw Object.assign(new Error(secret),{statusCode});
  }}};
  const output=await executeCompleteApi(ctx);
  assert.equal(output[0].length,2);
  assert(output[0].every(item=>item.json.errorCode===expected),JSON.stringify(output));
  assert(!JSON.stringify(output).includes(secret));
  ctx.continueOnFail=()=>false;
  await assert.rejects(()=>executeCompleteApi(ctx),error=>!JSON.stringify(error).includes(secret)&&!error.message.includes(secret));
  executionCases++;
 }
 console.log(JSON.stringify({safeErrorCases:cases.length,executionCases,passed:true}));
}
main().catch(error=>{console.error(error);process.exitCode=1});
