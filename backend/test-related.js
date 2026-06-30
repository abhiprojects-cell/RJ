import ytdl from '@distube/ytdl-core';

async function test() {
  const url = 'https://www.youtube.com/watch?v=kJQP7kiw5Fk'; // Despacito
  const info = await ytdl.getBasicInfo(url);
  console.log('Related videos count:', info.related_videos?.length);
  if (info.related_videos?.length) {
    console.log(info.related_videos.slice(0, 2).map(v => ({
      id: v.id,
      title: v.title,
      author: v.author?.name || v.author
    })));
  }
}
test().catch(console.error);
