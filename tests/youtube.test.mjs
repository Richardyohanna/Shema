import assert from "node:assert/strict";
import test from "node:test";
import { getYouTubeId, getYouTubeStartSeconds, getYouTubeEmbedUrl } from "../lib/youtube.ts";

const id = "dQw4w9WgXcQ";

test("extracts video ids from supported YouTube URL formats", () => {
  const urls = [
    `https://www.youtube.com/watch?v=${id}&feature=share`,
    `https://youtu.be/${id}?si=abc`,
    `https://youtube.com/embed/${id}`,
    `https://youtube.com/shorts/${id}`,
    `https://youtube.com/live/${id}`,
    `https://m.youtube.com/watch?v=${id}`,
    `https://music.youtube.com/watch?v=${id}`,
    id,
  ];

  for (const url of urls) assert.equal(getYouTubeId(url), id);
});

test("rejects non-YouTube urls and invalid ids", () => {
  assert.equal(getYouTubeId("https://example.com/watch?v=" + id), null);
  assert.equal(getYouTubeId("https://youtube.com/watch?v=invalid"), null);
  assert.equal(getYouTubeId(""), null);
});

test("preserves numeric and formatted start times", () => {
  assert.equal(getYouTubeStartSeconds(`https://youtu.be/${id}?t=90`), 90);
  assert.equal(getYouTubeStartSeconds(`https://www.youtube.com/watch?v=${id}&start=1h2m3s`), 3723);
  assert.equal(getYouTubeStartSeconds(`https://youtube.com/watch?v=${id}`), null);
  assert.equal(getYouTubeEmbedUrl(id, 90), `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&start=90`);
});
