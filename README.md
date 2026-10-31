# Gamingchen 的个人补充规则

供 AdGuard Home 和 Quantumult X 共用的个人补充规则。两端读取同一个纯域名文件，规则追加只需要在 GitHub 上增加一行域名。

## 规则源

- 文件：[`docs/personal-ads.txt`](docs/personal-ads.txt)
- 语法：一行一个精确 DNS 主机名
- 注释：整行 `#` 注释
- 不支持：`||domain^`、通配符、URL、端口、IP、策略名和内联注释

当前初始域名：

```text
ssp.iytcdn.com
tnc3-alisc1.zijieapi.com
mssdk.volces.com
mamasearchad.cloudvideocdn.taobao.com
alimama.cloudvideocdn.taobao.com
```

其中 `tnc3-alisc1.zijieapi.com` 和 `mssdk.volces.com` 已被现有 AdGuard 清单覆盖，但在 AdGuard 端会有意保留，以便同一文件同时补齐 Quantumult X。

## 首次发布

1. 在 GitHub 创建公开仓库，默认名称为 `adblock-rules`。
2. 将本目录推送到仓库的 `main` 分支。
3. 打开 `Settings -> Pages -> Build and deployment`，将 `Source` 设置为 `GitHub Actions`。
4. 在 `Actions` 中重新运行 `Validate and publish rules`，或再推送一次提交。

如果首次推送时尚未开启 Pages，校验任务仍会完成，但部署任务可能失败。开启 Pages 后重新运行同一个工作流即可。

仓库必须公开，客户端才能匿名读取规则，不需要在设备内保存 GitHub 令牌。

## AdGuard Home

保留现有的 `filter_21.txt`、`filter_29.txt`，再增加一个自定义 DNS 黑名单：

```text
https://cdn.jsdelivr.net/gh/Gamingchen/adblock-rules@main/docs/personal-ads.txt
```

操作路径：

```text
Filters -> DNS blocklists -> Add blocklist -> Add a custom list
```

名称可填 `PersonalAds`。如果 GitHub 用户名、仓库名或分支发生变化，请同步修改 URL。

AdGuard Home 将该文件按官方 domains-only 语法解析，每个域名只匹配自身，不自动匹配子域。

## Quantumult X

继续保留 blackmatrix7 的 `Advertising.list`。解析器建议使用 jsDelivr 镜像，避免 `raw.githubusercontent.com` 在部分网络下不可用：

```ini
[general]
resource_parser_url=https://cdn.jsdelivr.net/gh/KOP-XIAO/QuantumultX@master/Scripts/resource-parser.js

[filter_remote]
https://cdn.jsdelivr.net/gh/Gamingchen/adblock-rules@main/docs/personal-ads.txt#type=domain-set, tag=PersonalAds, force-policy=reject, enabled=true
```

`type=domain-set` 会指示资源解析器把每个纯域名转换为精确的 `host, domain` 规则，避免被自动转换成 `host-suffix`。`force-policy=reject` 确保规则无论是否存在同名策略组都执行拒绝。

如果已经设置过 `resource_parser_url`，只需替换为上面的 jsDelivr 地址，或继续使用你确认可访问的 raw GitHub 地址。

## 追加规则

1. 在 GitHub 打开 `docs/personal-ads.txt`。
2. 增加一个精确主机名，例如：

```text
ads.example.com
```

3. 提交到 `main`。
4. GitHub Actions 自动运行语法校验和测试。
5. 校验通过后自动部署 GitHub Pages，并尝试刷新 jsDelivr 缓存。

只写主机名。需要注释时，注释必须独占一行：

```text
# New ad endpoint
ads.example.com
```

不要在域名后面追加注释：

```text
ads.example.com # 错误：不能用内联注释
```

## 分发地址

主地址，供 AdGuard Home 和 Quantumult X 使用：

```text
https://cdn.jsdelivr.net/gh/Gamingchen/adblock-rules@main/docs/personal-ads.txt
```

GitHub Pages 备用地址：

```text
https://Gamingchen.github.io/adblock-rules/personal-ads.txt
```

Quantumult X 使用备用地址时，保留解析参数：

```ini
https://Gamingchen.github.io/adblock-rules/personal-ads.txt#type=domain-set, tag=PersonalAds, force-policy=reject, enabled=true
```

如果 jsDelivr 更新不及时或暂时不可用，可以临时切换到 GitHub Pages 备用地址。

## 本地校验

需要 Node.js 20 或更高版本：

```bash
npm run check
```

等价于：

```bash
node scripts/validate-rules.mjs
node --test scripts/validate-rules.test.mjs
```

校验器会检查：

- 5 个初始域名是否仍然存在
- 是否为合法小写 ASCII DNS 主机名
- 是否存在重复域名
- 是否混入 URL、IP、端口、通配符、AdGuard/QX 语法或内联注释

## 发布后验证

```bash
curl -fsSL "https://cdn.jsdelivr.net/gh/Gamingchen/adblock-rules@main/docs/personal-ads.txt"
curl -fsSL "https://Gamingchen.github.io/adblock-rules/personal-ads.txt"
```

两个地址应返回相同文本。随后可在 AdGuard Home 查询日志确认 `ssp.iytcdn.com` 被拦截，并在 Quantumult X 中确认 `PersonalAds` 已启用且包含 5 条规则。

## 限制

当前共享格式只支持精确主机名。如果以后需要 `*.example.com` 这类后缀匹配，应改为维护一份带类型标记的源文件，并生成 AdGuard 和 Quantumult X 两份输出，而不是继续使用单一纯域名文件。
