import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { UserPlus, Lock, CheckCircle2, Mail, Send } from 'lucide-react';
import logo from '../assets/logo.png';
import {
  checkCPFExists,
  createInscricao,
  getInscricoesAtivas,
} from '../services/firestore';
import { sendConfirmationEmail } from '../services/emailService';
import {
  cleanCPF,
  formatCPF,
  formatPhone,
  formatDate,
  validateCPF,
  parseDateBR,
  calcAge,
} from '../utils';

export default function InscricaoForm() {
  const [inscricoesAtivas, setInscricoesAtivas] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);
  const [resendingEmail, setResendingEmail] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({ mode: 'onBlur' });

  useEffect(() => {
    getInscricoesAtivas().then(setInscricoesAtivas);
  }, []);

  // Masks
  const handleCPFChange = (e) => {
    setValue('cpf', formatCPF(e.target.value), { shouldValidate: false });
  };
  const handlePhoneChange = (e) => {
    setValue('telefone', formatPhone(e.target.value), { shouldValidate: false });
  };
  const handleDateChange = (e) => {
    setValue('data_nascimento', formatDate(e.target.value), { shouldValidate: false });
  };

  const handleResendConfirmation = async () => {
    if (!submittedData) return;
    setResendingEmail(true);
    const toastId = toast.loading('Reenviando e-mail de confirmação...');
    try {
      const res = await sendConfirmationEmail(submittedData);
      if (res.success) {
        setSubmittedData(prev => ({ ...prev, emailResult: res }));
        toast.success(`E-mail enviado com sucesso para ${submittedData.email}! 🎉`, { id: toastId });
      } else {
        toast.error(`Aviso: ${res.message || 'Chave do Resend não configurada.'}`, { id: toastId });
      }
    } catch {
      toast.error('Erro ao tentar reenviar e-mail.', { id: toastId });
    } finally {
      setResendingEmail(false);
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const cpfLimpo = cleanCPF(data.cpf);

      // Validate CPF algorithm
      if (!validateCPF(cpfLimpo)) {
        toast.error('CPF inválido. Verifique e tente novamente.');
        return;
      }

      // Check duplicate CPF
      const exists = await checkCPFExists(cpfLimpo);
      if (exists) {
        toast.error('Este CPF já está cadastrado no sistema.');
        return;
      }

      // Parse and validate birth date
      const birthDate = parseDateBR(data.data_nascimento);
      if (!birthDate) {
        toast.error('Data de nascimento inválida. Use o formato dd/mm/aaaa.');
        return;
      }

      const idade = calcAge(birthDate);

      const novaInscricao = {
        cpf: cpfLimpo,
        nome: (data.nome || '').trim(),
        email: (data.email || '').trim(),
        estado_civil: data.estado_civil || '',
        sexo: data.sexo || '',
        data_nascimento: data.data_nascimento || '',
        endereco: data.endereco || '',
        bairro: data.bairro || '',
        cidade_estado: data.cidade_estado || '',
        telefone: data.telefone || '',
        idade,
        chefe_de_equipe: data.chefe_de_equipe === 'sim',
      };

      await createInscricao(novaInscricao);

      // Envia o e-mail de notificação de confirmação de cadastro
      let emailResult = null;
      try {
        emailResult = await sendConfirmationEmail(novaInscricao);
      } catch (eMailErr) {
        console.warn('Falha no envio de e-mail:', eMailErr);
        emailResult = { success: false, message: eMailErr.message };
      }

      setSubmittedData({ ...novaInscricao, emailResult });
      toast.success('Inscrição realizada com sucesso! 🎉');
      reset();
    } catch (err) {
      console.error('Erro detalhado ao salvar inscrição:', err);
      toast.error(`Erro: ${err.message || 'Erro ao salvar inscrição. Tente novamente.'}`);
    } finally {
      setLoading(false);
    }
  };

  if (inscricoesAtivas === null) {
    return (
      <div className="page-center">
        <div className="spinner" />
      </div>
    );
  }

  if (!inscricoesAtivas) {
    return (
      <div className="page-center">
        <div className="closed-card">
          <Lock size={48} className="closed-icon" />
          <h2>Inscrições Encerradas</h2>
          <p>As inscrições para a Semana Universitária Cajuruense estão temporariamente fechadas.</p>
          <p>Fique atento às nossas redes sociais para novidades!</p>
        </div>
      </div>
    );
  }

  if (submittedData) {
    return (
      <div className="page-center">
        <div className="success-card">
          <div className="success-icon-wrapper">
            <CheckCircle2 size={64} className="success-icon" />
          </div>
          <h2>Inscrição Realizada com Sucesso! 🎉</h2>
          <p className="success-sub">
            Sua vaga na <strong>Semana Universitária Cajuruense</strong> foi cadastrada e salva com sucesso.
          </p>

          <div className="success-banner-msg">
            <span>✅ O cadastro foi registrado com sucesso no sistema.</span>
          </div>

          {/* Email Notification Banner */}
          {submittedData.emailResult?.success ? (
            <div className="email-notice-card success">
              <Mail size={22} className="email-notice-icon" />
              <div>
                <div className="email-notice-title">E-mail de Notificação Enviado! 📬</div>
                <div className="email-notice-desc">
                  Enviamos um e-mail para <strong>{submittedData.email}</strong> notificando que seu cadastro foi concluído com êxito!
                </div>
              </div>
            </div>
          ) : (
            <div className="email-notice-card info">
              <Mail size={22} className="email-notice-icon" />
              <div style={{ flex: 1 }}>
                <div className="email-notice-title">E-mail Cadastrado: {submittedData.email}</div>
                <div className="email-notice-desc">
                  Seu cadastro foi salvo no banco de dados. {submittedData.emailResult?.message ? `(${submittedData.emailResult.message})` : ''}
                </div>
              </div>
              <button
                type="button"
                className="btn-resend-email"
                onClick={handleResendConfirmation}
                disabled={resendingEmail}
                title="Tentar enviar e-mail novamente"
              >
                <Send size={13} /> {resendingEmail ? 'Enviando...' : 'Reenviar'}
              </button>
            </div>
          )}

          <div className="success-details">
            <div className="success-details-row">
              <span className="success-details-label">Nome:</span>
              <span className="success-details-val">{submittedData.nome}</span>
            </div>
            <div className="success-details-row">
              <span className="success-details-label">CPF:</span>
              <span className="success-details-val mono">{formatCPF(submittedData.cpf)}</span>
            </div>
            <div className="success-details-row">
              <span className="success-details-label">E-mail:</span>
              <span className="success-details-val">{submittedData.email}</span>
            </div>
            <div className="success-details-row">
              <span className="success-details-label">Data de Nasc.:</span>
              <span className="success-details-val">{submittedData.data_nascimento}</span>
            </div>
            <div className="success-details-row">
              <span className="success-details-label">Interesse em Chefe:</span>
              <span className="success-details-val">
                {submittedData.chefe_de_equipe ? 'Sim, me interesso' : 'Não me interesso'}
              </span>
            </div>
          </div>

          <div className="form-actions" style={{ justifyContent: 'center' }}>
            <button
              type="button"
              className="btn-primary"
              onClick={() => setSubmittedData(null)}
            >
              Fazer Nova Inscrição
            </button>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="form-page">
      <div className="form-container">
        {/* Header */}
        <div className="form-header">
          <img src={logo} alt="Logo" className="form-logo" />
          <h1>Semana Universitária Cajuruense</h1>
          <h2>
            <UserPlus size={22} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Nova Inscrição
          </h2>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Row: CPF + Nome */}
          <div className="form-row">
            <div className="form-group col-4">
              <label className="form-label">
                CPF <span className="required">*</span>
              </label>
              <input
                className={`form-input ${errors.cpf ? 'is-invalid' : ''}`}
                placeholder="000.000.000-00"
                {...register('cpf', {
                  required: 'CPF é obrigatório',
                  minLength: { value: 14, message: 'CPF incompleto' },
                })}
                onChange={handleCPFChange}
                maxLength={14}
              />
              {errors.cpf && <span className="error-msg">{errors.cpf.message}</span>}
            </div>
            <div className="form-group col-8">
              <label className="form-label">
                Nome completo <span className="required">*</span>
              </label>
              <input
                className={`form-input ${errors.nome ? 'is-invalid' : ''}`}
                placeholder="Digite seu nome completo"
                {...register('nome', {
                  required: 'Nome é obrigatório',
                  minLength: { value: 2, message: 'Nome muito curto' },
                  maxLength: { value: 200, message: 'Nome muito longo' },
                })}
              />
              {errors.nome && <span className="error-msg">{errors.nome.message}</span>}
            </div>
          </div>

          {/* Row: Email + Estado Civil + Sexo */}
          <div className="form-row">
            <div className="form-group col-6">
              <label className="form-label">
                E-mail <span className="required">*</span>
              </label>
              <input
                type="email"
                className={`form-input ${errors.email ? 'is-invalid' : ''}`}
                placeholder="seuemail@exemplo.com"
                {...register('email', {
                  required: 'E-mail é obrigatório',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Digite um e-mail válido',
                  },
                })}
              />
              {errors.email && <span className="error-msg">{errors.email.message}</span>}
              <p className="hint-text">📧 Enviaremos confirmação da inscrição para este e-mail</p>
            </div>
            <div className="form-group col-3">
              <label className="form-label">
                Estado civil <span className="required">*</span>
              </label>
              <select
                className={`form-select ${errors.estado_civil ? 'is-invalid' : ''}`}
                {...register('estado_civil', { required: 'Selecione o estado civil' })}
              >
                <option value="">Selecione</option>
                <option value="solteiro">Solteiro(a)</option>
                <option value="casado">Casado(a)</option>
                <option value="divorciado">Divorciado(a)</option>
                <option value="viuvo">Viúvo(a)</option>
              </select>
              {errors.estado_civil && <span className="error-msg">{errors.estado_civil.message}</span>}
            </div>
            <div className="form-group col-3">
              <label className="form-label">
                Sexo <span className="required">*</span>
              </label>
              <select
                className={`form-select ${errors.sexo ? 'is-invalid' : ''}`}
                {...register('sexo', { required: 'Selecione o sexo' })}
              >
                <option value="">Selecione</option>
                <option value="masculino">Masculino</option>
                <option value="feminino">Feminino</option>
                <option value="outro">Outro</option>
              </select>
              {errors.sexo && <span className="error-msg">{errors.sexo.message}</span>}
            </div>
          </div>

          {/* Row: Data Nasc + Chefe */}
          <div className="form-row">
            <div className="form-group col-4">
              <label className="form-label">
                Data de nascimento <span className="required">*</span>
              </label>
              <input
                className={`form-input ${errors.data_nascimento ? 'is-invalid' : ''}`}
                placeholder="dd/mm/aaaa"
                {...register('data_nascimento', {
                  required: 'Data de nascimento é obrigatória',
                  minLength: { value: 10, message: 'Data incompleta' },
                })}
                onChange={handleDateChange}
                maxLength={10}
              />
              {errors.data_nascimento && <span className="error-msg">{errors.data_nascimento.message}</span>}

            </div>
            <div className="form-group col-8">
              <label className="form-label">
                Interesse em ser chefe de equipe <span className="required">*</span>
              </label>
              <select
                className={`form-select ${errors.chefe_de_equipe ? 'is-invalid' : ''}`}
                {...register('chefe_de_equipe', { required: 'Selecione uma opção' })}
              >
                <option value="">Selecione</option>
                <option value="nao">Não me interesso</option>
                <option value="sim">Sim me interesso</option>
              </select>
              {errors.chefe_de_equipe && <span className="error-msg">{errors.chefe_de_equipe.message}</span>}
            </div>
          </div>

          {/* Endereço */}
          <div className="form-group">
            <label className="form-label">
              Endereço <span className="required">*</span>
            </label>
            <input
              className={`form-input ${errors.endereco ? 'is-invalid' : ''}`}
              placeholder="Rua, número, complemento..."
              {...register('endereco', { required: 'Endereço é obrigatório' })}
            />
            {errors.endereco && <span className="error-msg">{errors.endereco.message}</span>}
          </div>

          {/* Row: Bairro + Cidade + Telefone */}
          <div className="form-row">
            <div className="form-group col-4">
              <label className="form-label">
                Bairro <span className="required">*</span>
              </label>
              <input
                className={`form-input ${errors.bairro ? 'is-invalid' : ''}`}
                placeholder="Nome do bairro"
                {...register('bairro', { required: 'Bairro é obrigatório' })}
              />
              {errors.bairro && <span className="error-msg">{errors.bairro.message}</span>}
            </div>
            <div className="form-group col-4">
              <label className="form-label">
                Cidade <span className="required">*</span>
              </label>
              <input
                className={`form-input ${errors.cidade_estado ? 'is-invalid' : ''}`}
                placeholder="Cidade"
                {...register('cidade_estado', { required: 'Cidade é obrigatória' })}
              />
              {errors.cidade_estado && <span className="error-msg">{errors.cidade_estado.message}</span>}
            </div>
            <div className="form-group col-4">
              <label className="form-label">
                Telefone <span className="required">*</span>
              </label>
              <input
                className={`form-input ${errors.telefone ? 'is-invalid' : ''}`}
                placeholder="(00) 00000-0000"
                {...register('telefone', { required: 'Telefone é obrigatório' })}
                onChange={handlePhoneChange}
                maxLength={15}
              />
              {errors.telefone && <span className="error-msg">{errors.telefone.message}</span>}
            </div>
          </div>

          {/* Required note */}
          <div className="required-note">
            <span className="required">*</span> Campos obrigatórios
          </div>

          {/* Buttons */}
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <span className="btn-spinner" /> Enviando...
                </>
              ) : (
                'Enviar Inscrição'
              )}
            </button>
            <button type="reset" className="btn-secondary" onClick={() => reset()}>
              Limpar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
