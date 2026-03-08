import { postQueue } from '../queues/postQueue.js';

export const schedulePost = async (req, res) => {
  const { postContent, scheduleTime, pageId, accessToken } = req.body;

  // 1. Pata karo ki abhi se kitni der baad post karni hai (Milliseconds mein)
  const delay = new Date(scheduleTime).getTime() - Date.now();

  if (delay < 0) {
    return res.status(400).json({ message: "Bhai, purana time mat daalo!" });
  }

  // 2. Job ko Queue mein daal do
  await postQueue.add(
    'publish-to-facebook', 
    { postContent, pageId, accessToken }, // Ye data Worker ko milega
    { delay } // BullMQ isey utni der tak rok kar rakhega
  );

  res.json({ message: "Post schedule ho gayi hai! Chill maaro." });
};