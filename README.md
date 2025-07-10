# 💬 WhatsApp Clone - React Native

Hey there! 👋 Welcome to my WhatsApp clone project. This is a fully functional messaging app built with React Native that brings the familiar WhatsApp experience to your mobile device.

## 🚀 What's This About?

Ever wondered how messaging apps like WhatsApp work behind the scenes? Well, I decided to dive deep and build my own version from scratch! This project recreates the core features of WhatsApp with a modern, clean interface that feels just like home.

## ✨ Features That'll Make You Smile

- **Real-time Messaging** 💬 - Chat with your friends instantly, just like the real deal
- **Beautiful User Profiles** 👤 - Customize your profile with photos and personal info
- **Online Status** 🟢 - See who's online and ready to chat
- **Image Sharing** 📸 - Share photos from your gallery with ease
- **Elegant UI** 🎨 - Modern design with smooth animations and gradients
- **Search Functionality** 🔍 - Find your contacts quickly with the search bar
- **Secure Authentication** 🔐 - Firebase-powered user authentication

## 🛠️ Tech Stack (The Cool Stuff Under the Hood)

- **React Native** - For that smooth cross-platform experience
- **Expo** - Making development a breeze
- **Firebase** - Real-time database and authentication magic
- **Supabase** - Cloud storage for all those profile pictures
- **React Navigation** - Seamless screen transitions

## 📱 Screenshots

_Coming soon! I'm still perfecting those beautiful screens_ 📸

## 🏃‍♂️ Getting Started

Want to run this on your machine? Here's how:

### Prerequisites

- Node.js (v14 or higher)
- Expo CLI
- A phone with Expo Go app (or an emulator)

### Installation

1. **Clone this awesome project**

   ```bash
   git clone https://github.com/yourusername/whatsapp-clone.git
   cd whatsapp-clone
   ```

2. **Install the magic dependencies**

   ```bash
   npm install
   ```

3. **Set up your Firebase config**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Realtime Database and Authentication
   - Copy `config/index.template.js` to `config/index.js`
   - Replace the placeholder values with your actual Firebase credentials

4. **Configure Supabase for image storage**
   - Create a Supabase project at [Supabase](https://supabase.com/)
   - Create a storage bucket named "WhatsappCloneStorage"
   - Add your Supabase URL and anon key to `config/index.js`

5. **Fire it up!**

   ```bash
   expo start
   ```

6. **Scan the QR code** with Expo Go and watch the magic happen! ✨

### 🔒 Security Note
The `config/` folder is excluded from git tracking to protect your sensitive Firebase and Supabase credentials. Never commit your actual config files to a public repository!

## 📂 Project Structure

```
├── screens/           # All the beautiful screens
│   ├── Auth.js       # Login & registration
│   ├── Chat.js       # Where conversations happen
│   ├── Home.js       # Main hub
│   ├── NewUser.js    # First-time user setup
│   └── home/
│       ├── Group.js      # Group chat features
│       ├── ListProfile.js # Browse all users
│       └── MyProfile.js   # Your personal space
├── assets/           # Images, icons, and eye candy
├── config/           # Firebase and app configuration
└── android/          # Android-specific files
```

## 🎯 Roadmap (What's Coming Next)

- [ ] Group messaging (because chatting with multiple friends is fun!)
- [ ] Voice messages (for when typing is too much work)
- [ ] Push notifications (stay connected even when away)
- [ ] Dark mode (for those late-night conversations)
- [ ] Message reactions (express yourself with emojis!)
- [ ] File sharing (share documents, videos, and more)

## 🤝 Contributing

Found a bug? Have a cool feature idea? I'd love to hear from you! Feel free to:

- Open an issue
- Submit a pull request
- Reach out with suggestions

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Inspired by WhatsApp's amazing user experience
- Thanks to the React Native community for being awesome
- Coffee ☕ for keeping me awake during those late coding sessions

## 📧 Get In Touch

Questions? Ideas? Just want to say hi?

- Email: your.email@example.com
- Twitter: @yourusername

---

**Built with ❤️ and lots of coffee by Ahmed**

_P.S. If you like this project, don't forget to give it a ⭐! It means the world to me._
