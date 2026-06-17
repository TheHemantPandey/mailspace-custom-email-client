import mongoose from 'mongoose';

const EmailSchema = new mongoose.Schema(
  {
    // Unique identifier from the Gmail API to prevent storing duplicate entries
    gmailId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    // The specific thread this email belongs to, making it easy to build conversational views
    threadId: {
      type: String,
      required: true,
      index: true,
    },
    // Message metadata details
    subject: {
      type: String,
      default: '(No Subject)',
    },
    from: {
      name: String,
      address: { type: String, required: true, index: true },
    },
    to: [
      {
        name: String,
        address: String,
      },
    ],
    // Clean chronological tracking mapping to when the email was originally received
    dateReceived: {
      type: Date,
      required: true,
      index: true,
    },
    // Message content fields
    snippet: {
      type: String,
      default: '',
    },
    bodyHtml: {
      type: String,
      default: '',
    },
    bodyText: {
      type: String,
      default: '',
    },
    // System workflow and organization states
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    labels: {
      type: [String],
      default: [],
      index: true, // Speeds up sidebar filtering for Inbox, Sent, Trash, etc.
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt tracking in MongoDB Atlas
  }
);

// Prevent Next.js hot-reloading from recompiling models exponentially during development
const Email = mongoose.models.Email || mongoose.model('Email', EmailSchema);

export default Email;