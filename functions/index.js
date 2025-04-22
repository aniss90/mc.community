const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// تنسيق التاريخ إلى YYYY-MM-DD
function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

exports.aggregateMonthlyVisits = functions.pubsub.schedule('0 0 1 * *')
  .timeZone('Asia/Riyadh')
  .onRun(async (context) => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    
    const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
                      "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    const monthName = `${monthNames[lastMonth.getMonth()]} ${lastMonth.getFullYear()}`;
    
    const firstDay = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
    const lastDay = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);
    
    try {
      // جلب البيانات اليومية للشهر الماضي
      const dailyQuery = query(
        collection(db, 'daily_visits'),
        where('date', '>=', formatDate(firstDay)),
        where('date', '<=', formatDate(lastDay))
      );
      
      const snapshot = await getDocs(dailyQuery);
      let totalVisits = 0;
      
      snapshot.forEach(doc => {
        totalVisits += doc.data().count;
      });
      
      // حفظ البيانات الشهرية
      await setDoc(doc(db, 'monthly_visits', monthName), {
        month: monthName,
        count: totalVisits,
        year: lastMonth.getFullYear(),
        monthNumber: lastMonth.getMonth() + 1,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`تم تجميع بيانات الشهر: ${monthName} - ${totalVisits} زائر`);
      return null;
    } catch (error) {
      console.error('حدث خطأ:', error);
      return null;
    }
  });

// دالة لتسجيل الزيارات اليومية
exports.recordVisit = functions.https.onRequest(async (req, res) => {
  const today = formatDate(new Date());
  const visitRef = doc(db, 'daily_visits', today);
  
  try {
    await runTransaction(db, async (transaction) => {
      const doc = await transaction.get(visitRef);
      
      if (doc.exists()) {
        transaction.update(visitRef, {
          count: (doc.data().count || 0) + 1,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        });
      } else {
        transaction.set(visitRef, {
          date: today,
          count: 1,
          firstCreated: admin.firestore.FieldValue.serverTimestamp(),
          lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    });
    
    res.status(200).send('تم تسجيل الزيارة');
  } catch (error) {
    console.error('Error recording visit:', error);
    res.status(500).send('حدث خطأ');
  }
});