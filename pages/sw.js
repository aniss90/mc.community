self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  // ممكن تضيف هنا أي إجراء عند النقر على الإشعار
});