const {onCall,HttpsError} = require('firebase-functions/v2/https');
const {onDocumentCreated} = require('firebase-functions/v2/firestore');
const {defineSecret} = require('firebase-functions/params');
const admin = require('firebase-admin');
admin.initializeApp();
const db=admin.firestore();
const MANAGEMENT_PHONE = defineSecret('MANAGEMENT_PHONE');
const normPhone=p=>String(p||'').replace(/\s+/g,'').replace(/^09/, '+989');
const management=req=>{if(!req.auth||req.auth.token.role!=='management')throw new HttpsError('permission-denied','فقط مدیریت اصلی مجاز است.');};
const staff=req=>{if(!req.auth||!['management','admin'].includes(req.auth.token.role))throw new HttpsError('permission-denied','دسترسی مدیریتی لازم است.');};
exports.bootstrapManagement=onCall({secrets:[MANAGEMENT_PHONE]},async req=>{if(!req.auth)throw new HttpsError('unauthenticated','ورود لازم است.');const phone=req.auth.token.phone_number||'';const managementPhone=normPhone(MANAGEMENT_PHONE.value());if(normPhone(phone)!==managementPhone)throw new HttpsError('permission-denied','این شماره مدیریت نیست.');await admin.auth().setCustomUserClaims(req.auth.uid,{role:'management'});await db.collection('users').doc(req.auth.uid).set({phone,role:'management',updatedAt:admin.firestore.FieldValue.serverTimestamp()},{merge:true});return{ok:true};});
exports.setAdminRole=onCall(async req=>{management(req);const {uid,phone,enabled}=req.data||{};if((!uid&&!phone)||typeof enabled!=='boolean')throw new HttpsError('invalid-argument','اطلاعات نامعتبر است.');if(uid===req.auth.uid)throw new HttpsError('failed-precondition','مدیریت اصلی قابل حذف نیست.');let targetUid=uid; let u; if(phone){ try{u=await admin.auth().getUserByPhoneNumber(normPhone(phone)); targetUid=u.uid;}catch(e){throw new HttpsError('not-found','این شماره ابتدا باید یک‌بار با پیامک وارد AL_VER شده باشد.');}} else {u=await admin.auth().getUser(targetUid);}
if(targetUid===req.auth.uid)throw new HttpsError('failed-precondition','مدیریت اصلی قابل حذف نیست.'); await admin.auth().setCustomUserClaims(targetUid,enabled?{role:'admin'}:{}); await db.collection('admins').doc(targetUid).set({uid:targetUid,phone:u.phoneNumber||phone||'',enabled,updatedAt:admin.firestore.FieldValue.serverTimestamp()},{merge:true});return{ok:true};});
exports.setListingStatus=onCall(async req=>{staff(req);const {listingId,status,publicPhone,reason}=req.data||{};if(!listingId||!['approved','rejected','archived'].includes(status))throw new HttpsError('invalid-argument','وضعیت نامعتبر است.');const data={status,updatedAt:admin.firestore.FieldValue.serverTimestamp(),updatedBy:req.auth.uid};if(status==='approved'){if(req.auth.token.role==='admin'&&!publicPhone)throw new HttpsError('failed-precondition','شماره تماس توسط مدیریت تعیین می‌شود.');if(publicPhone)data.publicPhone=String(publicPhone).trim();data.approvedAt=admin.firestore.FieldValue.serverTimestamp();data.approvedBy=req.auth.uid;}if(reason)data.rejectionReason=String(reason).slice(0,500);await db.collection('listings').doc(listingId).update(data);return{ok:true};});
exports.deleteListing=onCall(async req=>{management(req);const {listingId}=req.data||{};if(!listingId)throw new HttpsError('invalid-argument','listingId لازم است.');await db.collection('listings').doc(listingId).delete();return{ok:true};});
exports.submitBuyerInquiry=onCall(async req=>{
  if(!req.auth) throw new HttpsError('unauthenticated','ورود لازم است.');
  const {listingId,message}=req.data||{};
  if(!listingId||!message) throw new HttpsError('invalid-argument','آگهی و پیام لازم است.');
  const listing=await db.collection('listings').doc(listingId).get();
  if(!listing.exists||listing.data().status!=='approved') throw new HttpsError('not-found','آگهی در دسترس نیست.');
  const c=await db.collection('conversations').add({listingId,buyerUid:req.auth.uid,status:'open',createdAt:admin.firestore.FieldValue.serverTimestamp(),lastMessageAt:admin.firestore.FieldValue.serverTimestamp()});
  await c.collection('messages').add({senderUid:req.auth.uid,senderRole:'buyer',message:String(message).slice(0,3000),createdAt:admin.firestore.FieldValue.serverTimestamp()});
  return {ok:true,conversationId:c.id};
});
exports.sendManagedMessage=onCall(async req=>{
  staff(req); const {conversationId,message}=req.data||{};
  if(!conversationId||!message) throw new HttpsError('invalid-argument','گفتگو و پیام لازم است.');
  const c=await db.collection('conversations').doc(conversationId).get(); if(!c.exists) throw new HttpsError('not-found','گفتگو یافت نشد.');
  await c.ref.update({lastMessageAt:admin.firestore.FieldValue.serverTimestamp(),lastSenderUid:req.auth.uid});
  await c.ref.collection('messages').add({senderUid:req.auth.uid,senderRole:req.auth.token.role,message:String(message).slice(0,3000),createdAt:admin.firestore.FieldValue.serverTimestamp()});
  return {ok:true};
});
exports.onListingCreated=onDocumentCreated('listings/{id}',async e=>{if(e.data)await e.data.ref.set({createdAt:e.data.get('createdAt')||admin.firestore.FieldValue.serverTimestamp(),views:0},{merge:true});});
exports.incrementView=onCall(async req=>{const {listingId}=req.data||{};if(!listingId)throw new HttpsError('invalid-argument','listingId لازم است.');await db.collection('listings').doc(listingId).update({views:admin.firestore.FieldValue.increment(1)});return{ok:true};});
