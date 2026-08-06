# Bo Lac Thu Nhun PixiJS

Wink mini-game chạy trong iframe của `https://winkgames.papastudio.net`.
Production game origin là `https://bo-lac-thu-nhun.papastudio.net`.

## Local verification

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm run verify:wink-bridge
corepack pnpm run build
```

Production bắt buộc chạy trong Wink iframe. Mở game trực tiếp ngoài parent
được cho phép sẽ dừng với lỗi `PARENT_REQUIRED`. Runtime config chỉ chứa public
metadata; access token và session authority luôn nằm trong bridge closure.

- Protocol version: `1`
- Bridge version: `9.0.1`
- Allowed parent: `https://winkgames.papastudio.net`
