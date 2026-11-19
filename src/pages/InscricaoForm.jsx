import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { UserPlus, Lock, CheckCircle2, Mail, Send, Heart, ShieldCheck, Calendar } from 'lucide-react';
import bannerImg from '../assets/banner-suc.jpg';
import {
  checkCPFExists,
  createInscricao,
  getInscricoesAtivas,
} from '../services/firestore';
import { sendConfirmationEmail } from '../services/emailService';
// Analytics removido (Firebase desativado)
function logAnalyticsEvent(event, params) {
  console.debug('[analytics]', event, params);
}
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

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    watch,
    reset,
    formState: { errors },
  } = useForm({ mode: 'onBlur' });

  // Monitora data de nascimento e estado civil
  const dataNascimentoVal = watch('data_nascimento');
  const estadoCivilVal = watch('estado_civil');

  const isMenor = estadoCivilVal === 'Menor (13 a 17 anos)';
  const isCasado = estadoCivilVal === 'Casado(a)';
  const isUniaoEstavel = estadoCivilVal === 'União Estável';
  const hasSpouse = isCasado || isUniaoEstavel;

  const calculatedAge = useMemo(() => {
    if (!dataNascimentoVal || dataNascimentoVal.length < 10) return null;
    const parsed = parseDateBR(dataNascimentoVal);
    if (!parsed) return null;
    return calcAge(parsed);
  }, [dataNascimentoVal]);

  // Se for menor de 18 anos, desativa o interesse em ser chefe de equipe
  useEffect(() => {
    if (isMenor) {
      setValue('chefe_de_equipe', 'nao');
    }
  }, [isMenor, setValue]);

  // Se trocar de estado civil que requer cônjuge para outro, limpa campos do cônjuge
  useEffect(() => {
    if (!hasSpouse) {
      setValue('conjuge_nome', '');
      setValue('conjuge_cpf', '');
      setValue('conjuge_telefone', '');
      setValue('conjuge_data_nascimento', '');
    }
  }, [hasSpouse, setValue]);

  useEffect(() => {
    getInscricoesAtivas().then(setInscricoesAtivas);
    logAnalyticsEvent('page_view', { page_title: 'Formulário de Inscrição', page_location: window.location.href });
  }, []);

  // Masks
  const handleCPFChange = (e) => {
    setValue('cpf', formatCPF(e.target.value), { shouldValidate: false });
  };
  const handlePhoneChange = (e) => {
    setValue('telefone', formatPhone(e.target.value), { shouldValidate: false });
  };
  const handleDateChange = (e) => {
    const formatted = formatDate(e.target.value);
    setValue('data_nascimento', formatted, { shouldValidate: true, shouldDirty: true });
  };
  const handleConjugeCPFChange = (e) => {
    setValue('conjuge_cpf', formatCPF(e.target.value), { shouldValidate: true, shouldDirty: true });
  };
  const handleConjugePhoneChange = (e) => {
    setValue('conjuge_telefone', formatPhone(e.target.value), { shouldValidate: false });
  };
  const handleConjugeDateChange = (e) => {
    setValue('conjuge_data_nascimento', formatDate(e.target.value), { shouldValidate: false });
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
        toast.error(`Aviso: ${res.message || 'Erro ao enviar e-mail de confirmação.'}`, { id: toastId });
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
        logAnalyticsEvent('inscricao_cpf_duplicado');
        return;
      }

      // Validações de segurança do CPF da Esposa ou Esposo (quando Casado(a) ou União Estável)
      let conjugeCpfLimpo = '';
      if (hasSpouse) {
        conjugeCpfLimpo = cleanCPF(data.conjuge_cpf || '');

        if (!conjugeCpfLimpo) {
          toast.error('Informe o CPF da esposa ou esposo.');
          setError('conjuge_cpf', { message: 'CPF do(a) esposo(a) é obrigatório' });
          return;
        }

        // 1. Validação matemática do algoritmo do CPF (dígitos verificadores)
        if (!validateCPF(conjugeCpfLimpo)) {
          toast.error('CPF do(a) esposo(a) inválido. Verifique os números e tente novamente.');
          setError('conjuge_cpf', { message: 'CPF inválido (dígitos incorretos)' });
          return;
        }

        // 2. Segurança: CPF do cônjuge não pode ser igual ao CPF do titular
        if (conjugeCpfLimpo === cpfLimpo) {
          toast.error('O CPF do(a) esposo(a) não pode ser igual ao CPF do titular.');
          setError('conjuge_cpf', { message: 'Não pode ser igual ao CPF do titular' });
          return;
        }

        // 3. Segurança de duplicata de CPF: verifica se o CPF do cônjuge já existe no banco
        const conjugeExists = await checkCPFExists(conjugeCpfLimpo);
        if (conjugeExists) {
          toast.error('O CPF do(a) esposo(a) já está cadastrado no sistema.');
          setError('conjuge_cpf', { message: 'Este CPF já está cadastrado no sistema' });
          return;
        }
      }

      // Parse and validate birth date
      const birthDate = parseDateBR(data.data_nascimento);
      if (!birthDate) {
        toast.error('Data de nascimento inválida. Use o formato dd/mm/aaaa.');
        return;
      }

      // Validação do Aviso de Privacidade (LGPD)
      if (!data.aceite_lgpd) {
        toast.error('Você deve assinalar e concordar com o Aviso de Privacidade para enviar seu cadastro.');
        setError('aceite_lgpd', { message: 'Você deve assinalar e concordar com o Aviso de Privacidade' });
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
        idade: idade !== null ? Number(idade) : null,
        chefe_de_equipe: isMenor ? false : (data.chefe_de_equipe === 'sim'),
        aceite_lgpd: true,
        ...(hasSpouse ? {
          conjuge_nome: (data.conjuge_nome || '').trim(),
          conjuge_cpf: cleanCPF(data.conjuge_cpf || ''),
          conjuge_telefone: (data.conjuge_telefone || '').trim(),
          conjuge_data_nascimento: (data.conjuge_data_nascimento || '').trim(),
        } : {
          conjuge_nome: '',
          conjuge_cpf: '',
          conjuge_telefone: '',
          conjuge_data_nascimento: '',
        }),
      };

      await createInscricao(novaInscricao);

      logAnalyticsEvent('inscricao_concluida', {
        chefe_de_equipe: novaInscricao.chefe_de_equipe,
        cidade: novaInscricao.cidade_estado,
        sexo: novaInscricao.sexo,
      });

      // Envia o e-mail de notificação de confirmação de cadastro
      let emailResult = null;
      try {
        emailResult = await sendConfirmationEmail(novaInscricao);
        if (emailResult?.success) {
          logAnalyticsEvent('email_confirmacao_enviado', { method: emailResult.method });
        }
      } catch (eMailErr) {
        console.warn('Falha no envio de e-mail:', eMailErr);
        emailResult = { success: false, message: eMailErr.message };
      }

      setSubmittedData({ ...novaInscricao, emailResult });
      toast.success('Inscrição realizada com sucesso! 🎉');
      reset();
    } catch (err) {
      console.error('Erro detalhado ao salvar inscrição:', err);
      logAnalyticsEvent('inscricao_erro', { message: err.message || 'unknown' });
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
              <span className="success-details-label">Estado Civil:</span>
              <span className="success-details-val">{submittedData.estado_civil}</span>
            </div>
            {submittedData.conjuge_nome && (
              <div className="success-details-row">
                <span className="success-details-label">Cônjuge:</span>
                <span className="success-details-val">{submittedData.conjuge_nome}</span>
              </div>
            )}
            <div className="success-details-row">
              <span className="success-details-label">Data de Nasc.:</span>
              <span className="success-details-val">
                {submittedData.data_nascimento} {submittedData.idade !== null && submittedData.idade !== undefined ? `(${submittedData.idade} anos)` : ''}
              </span>
            </div>
            <div className="success-details-row">
              <span className="success-details-label">Interesse em Chefe:</span>
              <span className="success-details-val">
                {submittedData.estado_civil?.includes('Menor')
                  ? 'Não se aplica (Menor de idade)'
                  : (submittedData.chefe_de_equipe ? 'Sim, me interesso' : 'Não me interesso')}
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
          <img src={bannerImg} alt="Semana Universitária Cajuruense" className="form-banner" />
          <h1>Semana Universitária Cajuruense</h1>
          <h2>
            <UserPlus size={22} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Nova Inscrição
          </h2>

          {/* Aviso de Período e Contato */}
          <div className="period-notice-card">
            <div className="period-notice-dates">
              <Calendar size={18} className="period-notice-icon" />
              <span>
                <strong>Período de Inscrições:</strong> 16 a 30 de NOVEMBRO de 2026
              </span>
            </div>
            <div className="period-notice-contact">
              Ligue para <a href="tel:1636679938">(16) 3667-9938</a> ou envie uma mensagem para o Instagram{' '}
              <a href="https://instagram.com/culturacajuru" target="_blank" rel="noopener noreferrer">
                @culturacajuru
              </a>
            </div>
          </div>
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
                <option value="Solteiro(a) (maior 18 anos)">Solteiro(a) (maior 18 anos)</option>
                <option value="Menor (13 a 17 anos)">Menor (13 a 17 anos)</option>
                <option value="Casado(a)">Casado(a)</option>
                <option value="União Estável">União Estável</option>
                <option value="Divorciado(a)">Divorciado(a)</option>
                <option value="Viúvo(a)">Viúvo(a)</option>
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

          {/* Row: Data Nasc + Idade (+ Chefe de Equipe se maior de 18 anos) */}
          <div className="form-row">
            <div className={`form-group ${isMenor ? 'col-6' : 'col-3'}`}>
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

            <div className={`form-group ${isMenor ? 'col-6' : 'col-3'}`}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Idade</span>
                {calculatedAge !== null && (
                  <span className="age-badge">Auto</span>
                )}
              </label>
              <input
                className="form-input age-display-input"
                type="text"
                readOnly
                tabIndex={-1}
                value={calculatedAge !== null ? `${calculatedAge} anos` : ''}
                placeholder="Calculada auto."
                title="Idade calculada automaticamente a partir da data de nascimento"
              />
            </div>

            {!isMenor && (
              <div className="form-group col-6">
                <label className="form-label">
                  Interesse em ser chefe de equipe <span className="required">*</span>
                </label>
                <select
                  className={`form-select ${errors.chefe_de_equipe ? 'is-invalid' : ''}`}
                  {...register('chefe_de_equipe', { required: !isMenor ? 'Selecione uma opção' : false })}
                >
                  <option value="">Selecione</option>
                  <option value="nao">Não me interesso</option>
                  <option value="sim">Sim me interesso</option>
                </select>
                {errors.chefe_de_equipe && <span className="error-msg">{errors.chefe_de_equipe.message}</span>}
              </div>
            )}
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

          {/* Subformulário de Cônjuge (exibido para Casado(a) e União Estável) */}
          {hasSpouse && (
            <div className="spouse-section">
              <div className="spouse-section-header">
                <Heart size={20} className="spouse-icon" />
                <div>
                  <h3 className="spouse-section-title">Dados do(a) Esposo(a) / Cônjuge</h3>
                  <p className="spouse-section-subtitle">
                    {isCasado
                      ? 'Informe os dados do seu cônjuge para o cadastro de Casado(a)'
                      : 'Informe os dados do seu cônjuge para a União Estável'}
                  </p>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group col-6">
                  <label className="form-label">
                    Nome da Esposa / Esposo <span className="required">*</span>
                  </label>
                  <input
                    className={`form-input ${errors.conjuge_nome ? 'is-invalid' : ''}`}
                    placeholder="Nome completo do(a) companheiro(a)"
                    {...register('conjuge_nome', {
                      required: hasSpouse ? 'Nome do(a) esposo(a) é obrigatório' : false,
                    })}
                  />
                  {errors.conjuge_nome && <span className="error-msg">{errors.conjuge_nome.message}</span>}
                </div>

                <div className="form-group col-6">
                  <label className="form-label">
                    CPF da Esposa ou Esposo <span className="required">*</span>
                  </label>
                  <input
                    className={`form-input ${errors.conjuge_cpf ? 'is-invalid' : ''}`}
                    placeholder="000.000.000-00"
                    {...register('conjuge_cpf', {
                      required: hasSpouse ? 'CPF da esposa ou esposo é obrigatório' : false,
                      minLength: { value: 14, message: 'CPF incompleto' },
                      validate: (val) => {
                        if (!hasSpouse) return true;
                        if (!val) return 'CPF da esposa ou esposo é obrigatório';
                        const c = cleanCPF(val);
                        if (!validateCPF(c)) return 'CPF inválido (dígitos incorretos)';
                        return true;
                      },
                    })}
                    onChange={handleConjugeCPFChange}
                    maxLength={14}
                  />
                  {errors.conjuge_cpf && <span className="error-msg">{errors.conjuge_cpf.message}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group col-6">
                  <label className="form-label">Telefone / WhatsApp</label>
                  <input
                    className="form-input"
                    placeholder="(00) 00000-0000"
                    {...register('conjuge_telefone')}
                    onChange={handleConjugePhoneChange}
                    maxLength={15}
                  />
                </div>

                <div className="form-group col-6">
                  <label className="form-label">Data de Nascimento</label>
                  <input
                    className="form-input"
                    placeholder="dd/mm/aaaa"
                    {...register('conjuge_data_nascimento')}
                    onChange={handleConjugeDateChange}
                    maxLength={10}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Aviso de Privacidade – Proteção de Dados Pessoais (LGPD) */}
          <div className="privacy-section">
            <div className="privacy-section-header">
              <ShieldCheck size={22} className="privacy-icon" />
              <h3 className="privacy-title">Aviso de Privacidade – Proteção de Dados Pessoais</h3>
            </div>
            <p className="privacy-text">
              Os dados pessoais coletados por meio deste formulário serão tratados em conformidade com a Lei Federal nº 13.709/2018 – Lei Geral de Proteção de Dados Pessoais (LGPD), sendo utilizados exclusivamente para fins de organização, planejamento e realização da Semana Universitária. Os dados serão armazenados e utilizados de forma segura, respeitando os princípios de finalidade, necessidade, transparência e segurança, não sendo compartilhados com terceiros, salvo quando necessário e permitido pela legislação vigente.
            </p>
            <label className={`privacy-consent-wrapper ${errors.aceite_lgpd ? 'is-invalid' : ''}`}>
              <input
                type="checkbox"
                className="privacy-checkbox"
                {...register('aceite_lgpd', {
                  required: 'Você deve assinalar e concordar com o Aviso de Privacidade para enviar seu cadastro.',
                })}
              />
              <span className="privacy-label">
                Li, compreendi e concordo com o <strong>Aviso de Privacidade</strong> e autorizo o tratamento dos meus dados pessoais para a Semana Universitária. <span className="required">*</span>
              </span>
            </label>
            {errors.aceite_lgpd && (
              <span className="error-msg" style={{ marginTop: '8px', display: 'block' }}>
                {errors.aceite_lgpd.message}
              </span>
            )}
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
