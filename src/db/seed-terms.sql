-- Insert Terms of Use
INSERT INTO legal_documents (type, content, version, is_active)
VALUES (
  'terms_of_use',
  '<h2>1. Aceitação dos Termos</h2><p>Ao acessar e usar o NextSchedule, você concorda em cumprir e ficar vinculado aos seguintes termos e condições de uso.</p><h2>2. Descrição do Serviço</h2><p>O NextSchedule é uma plataforma de agendamento e gestão para clínicas e profissionais de saúde.</p><h2>3. Cadastro e Conta</h2><p>Para usar o serviço, você deve se cadastrar e fornecer informações precisas e completas. Você é responsável por manter a confidencialidade de sua conta e senha.</p><h2>4. Uso Aceitável</h2><p>Você concorda em não usar o serviço para qualquer finalidade ilegal ou não autorizada.</p><h2>5. Cancelamento</h2><p>Você pode cancelar sua conta a qualquer momento. O NextSchedule reserva-se o direito de suspender ou encerrar sua conta se você violar estes termos.</p>',
  '1.0',
  true
);

-- Insert Privacy Policy
INSERT INTO legal_documents (type, content, version, is_active)
VALUES (
  'privacy_policy',
  '<h2>1. Coleta de Informações</h2><p>Coletamos informações que você nos fornece diretamente, como nome, email, CPF e dados de agendamento.</p><h2>2. Uso das Informações</h2><p>Usamos suas informações para fornecer, manter e melhorar nossos serviços, processar transações e enviar comunicações.</p><h2>3. Compartilhamento de Informações</h2><p>Não vendemos suas informações pessoais. Podemos compartilhar informações com prestadores de serviços terceirizados que nos ajudam a operar nosso negócio.</p><h2>4. Segurança</h2><p>Implementamos medidas de segurança para proteger suas informações contra acesso não autorizado.</p>',
  '1.0',
  true
);

-- Insert Cookie Policy
INSERT INTO legal_documents (type, content, version, is_active)
VALUES (
  'cookie_policy',
  '<h2>1. O que são Cookies</h2><p>Cookies são pequenos arquivos de texto armazenados no seu dispositivo quando você visita nosso site.</p><h2>2. Como Usamos Cookies</h2><p>Usamos cookies para autenticação, preferências do usuário e análise de tráfego.</p><h2>3. Gerenciamento de Cookies</h2><p>Você pode controlar e gerenciar cookies através das configurações do seu navegador.</p>',
  '1.0',
  true
);
