import { Project, Node, FunctionDeclaration, SyntaxKind } from 'ts-morph';

function getFunctionDetail(fn: FunctionDeclaration): string {
  const name = fn.getName() ?? '匿名関数';
  const isExported = fn.isExported() ? '[exported] ' : '';
  const isAsync = fn.isAsync() ? '[async] ' : '';

  const params = fn.getParameters().map(p => {
    const typeStr = p.getType().getText();
    return `${p.getName()}: ${typeStr}`;
  }).join(', ');

  const returnType = fn.getReturnType().getText();

  // Reactコンポーネント（JSX/TSXを返すか）の簡易判定
  const isReactComponent = returnType.includes('JSX.Element') || returnType.includes('ReactNode');
  if (isReactComponent) {
    return `${isExported}Reactコンポーネント: <${name} /> (Props: { ${params} })`;
  }

  return `${isExported}${isAsync}関数: ${name}(${params}): ${returnType}`;
}

export async function annotateFile(filePath: string): Promise<string> {
  const code = await Bun.file(filePath).text();
  const project = new Project({ useInMemoryFileSystem: true });
  const sourceFile = project.createSourceFile(filePath, code);

  for (const statement of sourceFile.getStatements()) {
    let description: string | null = null;

    if (Node.isFunctionDeclaration(statement)) {
      description = getFunctionDetail(statement);
    } else if (Node.isInterfaceDeclaration(statement)) {
      const propKeys = statement.getProperties().map(p => p.getName()).join(', ');
      description = `[Export] インターフェース: ${statement.getName()} { ${propKeys} }`;
    } else if (Node.isClassDeclaration(statement)) {
      const methods = statement.getMethods().map(m => m.getName()).join(', ');
      description = `クラス: ${statement.getName() ?? '匿名'} (Method: ${methods})`;
    }

    if (description && (
      Node.isFunctionDeclaration(statement) ||
      Node.isInterfaceDeclaration(statement) ||
      Node.isClassDeclaration(statement)
    )) {
      // JSDoc 形式で出力するとエディタのホバー表示でも活用できる
      statement.addJsDoc({
        description: `ode: ${description}`,
      });
    }
  }

  return sourceFile.getFullText();
}
