// Attemptedly fix the weird webpack bundle issues introduced by where the module "@novu/notification-center" is dragged into the web client


module.exports = {
    NovuProvider: ({ children }) => children,
    PopoverNotificationCenter: () => null,
    NotificationBell: () => null,
    useNotifications: () => ({}),
};
