Todo

- edit dialog and backend for editing record name
- delete dialog and backend for deleting record by id [done]
- ffmpeg integrate
- collect 3-4 unlicensed bgm for fading effect (using ffmpeg to blend in and repeat to have a continunouse audiobook recording experience)
- sort by created date (recordings UI)
- improve logs [done]
  - microphone not connectted
  - peer connection failed
  - stopped recording
  - connecttion error
- refactor [done]

New Ideas:

- tree-like folder support (of child-level 1) of the root

  - Edit recording -> assign random emoji
  - combine audio with (list of audios as its sibling) + (add as last, this one first that next) ffmpeg
  - save as copy (OR) overwrite both and save as one file - irreversible change

- ffmpeg module in go!
  - create waveform according to the audio (.ogg) when close and save file! -> add link to waveform in new directory.. waveform_link in json new field

IMPORTANT!!!!!

- integrate image + animate the waveform
  - use ffmpeg to find duration in seconds.. save it along on db.json
  - progress based on duration!! adjust!!
- to get duration of the audio `ffprobe -i recording_2.ogg -show_entries format=duration -v quiet -of csv="p=0"`
