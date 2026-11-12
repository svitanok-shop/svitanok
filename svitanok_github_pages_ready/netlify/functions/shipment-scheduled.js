const {database,updateStatus}=require('./shipment-core');
exports.config={schedule:'*/30 * * * *'};
exports.handler=async()=>{
 try{const snap=await database().ref('orders').get(),rows=Object.entries(snap.val()||{}).filter(([,o])=>o.tracking?.number&&!['cancelled','cancel'].includes(o.status)&&(!o.tracking.checkedAt||Date.now()-o.tracking.checkedAt>25*60000)).slice(0,40);let ok=0;
 for(const [id,o] of rows){try{await updateStatus(id,o);ok++}catch(e){console.error('Tracking',id,e.message)}}return {statusCode:200,body:JSON.stringify({checked:ok})};}
 catch(e){console.error(e);return {statusCode:500,body:'Tracking job error'}}
};
