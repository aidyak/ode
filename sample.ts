// [ode] インターフェース 'Config' の定義
interface Config {
    port: number;
}
// [ode] 関数 'startServer' の定義
function startServer(config: Config) {
    console.log(`Server running on port ${config.port}`);
}
