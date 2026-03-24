import mongoose from 'mongoose';

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/smart-campus');
  const db = mongoose.connection.db;

  const issueCommentsCount = await db.collection('issuecomments').countDocuments();
  const issueUpdatesCount = await db.collection('issueupdates').countDocuments();

  console.log(`issuecomments:${issueCommentsCount}`);
  console.log(`issueupdates:${issueUpdatesCount}`);

  const latestComment = await db
    .collection('issuecomments')
    .find({})
    .sort({ createdAt: -1 })
    .limit(1)
    .toArray();

  const latestUpdate = await db
    .collection('issueupdates')
    .find({})
    .sort({ createdAt: -1 })
    .limit(1)
    .toArray();

  if (latestComment[0]) {
    console.log(`latestCommentBy:${latestComment[0].authorEmail}`);
  }

  if (latestUpdate[0]) {
    console.log(`latestUpdateType:${latestUpdate[0].eventType}`);
  }

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
