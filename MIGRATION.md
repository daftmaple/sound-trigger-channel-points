# Migration guide for 1.1.1 to 1.2.0

## Linux

```sh
mkdir .config
mv points.json .config/points.json
mv config.toml .config/config.toml
mkdir .config/filter
mv filter/* .config/filter/
mkdir .config/tokens
mv tokens/* .config/tokens/
```
