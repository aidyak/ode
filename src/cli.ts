#!/usr/bin/env bun
import { Command } from "commander";
import * as path from "path";
import { annotateFile } from "./annotator";
import { Project, Node } from "ts-morph";

const program = new Command();

program
  .name("ode")
  .description("Annotate TypeScript files with descriptions")
  .version("0.1.0");

program
  .command("comment")
  .description("Annotate a TypeScript file")
  .argument("<file>", "TypeScript file to annotate")
  .option("-i, --in-place", "Edit the file in place", false)
  .action(async (file: string, options: { inPlace: boolean }) => {
    const absoluteFilePath = path.resolve(process.cwd(), file);
    const targetFile = Bun.file(absoluteFilePath);
    if (!(await targetFile.exists())) {
      console.error(`エラー: ファイルが見つかりません: ${file}`);
      process.exit(1);
    }

    try {
      const annotatedCode = await annotateFile(absoluteFilePath);

      if (options.inPlace) {
        await Bun.write(absoluteFilePath, annotatedCode);
        console.log(`✅ ${file} にコメントを直接上書き保存しました。`);
      } else {
        console.log(annotatedCode);
      }
    } catch (error) {
      console.error('解析中にエラーが発生しました:', error);
      process.exit(1);
    }
  });

program
  .command('outline')
  .description('ファイルの構文構造（目次）をターミナルに木構造で表示します')
  .argument('<file>', '解析対象のファイルパス')
  .action(async (file: string) => {
    const absolutePath = path.resolve(process.cwd(), file);
    const code = await Bun.file(absolutePath).text();
    
    const project = new Project({ useInMemoryFileSystem: true });
    const sourceFile = project.createSourceFile(absolutePath, code);

    console.log(`\n📄 Outline for ${file}:\n`);

    for (const statement of sourceFile.getStatements()) {
      if (Node.isFunctionDeclaration(statement)) {
        console.log(` ├─ 🧩 fn ${statement.getName() ?? 'anonymous'}`);
      } else if (Node.isClassDeclaration(statement)) {
        console.log(` ├─ 📦 class ${statement.getName()}`);
        statement.getMethods().forEach(m => {
          console.log(` │   └─ ⚙️  method ${m.getName()}`);
        });
      } else if (Node.isInterfaceDeclaration(statement)) {
        console.log(` ├─ 📐 interface ${statement.getName()}`);
      } else if (Node.isTypeAliasDeclaration(statement)) {
        console.log(` ├─ 🏷️  type ${statement.getName()}`);
      }
    }
    console.log('');
  });

program.parse(process.argv);
