# Manual testing checklist — GHD Hotels WebAR Scanner

Use this on a real device before calling the experience production-ready.

## Environment

- [ ] Desktop Chrome (UI / errors)
- [ ] iPhone Safari (primary)
- [ ] Android Chrome (primary)
- [ ] HTTPS tunnel or production HTTPS URL

## Cases

1. [ ] First-time camera permission
2. [ ] Returning user with permission already granted
3. [ ] Valid target detection on printed Samrāya artwork
4. [ ] Tracking lost and recovered
5. [ ] Missing `public/targets/samraya.mind`
6. [ ] Missing `public/videos/samraya.mp4`
7. [ ] Autoplay restrictions (Play button)
8. [ ] Missing/invalid `public/models/samraya.glb` in 3D mode
9. [ ] Repeated Start / Exit / Start
10. [ ] Camera cleanup on Exit (camera indicator turns off)
11. [ ] Real iPhone end-to-end
12. [ ] Real Android end-to-end

## Pass criteria

- Artwork detection is automatic (no fake timer / scan button)
- Video is anchored to the artwork in 3D space
- Content stays aligned while tracking holds
- Errors are human-readable with recovery actions
