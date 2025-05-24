const { MessageFlags, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, ModalBuilder, TextInputBuilder, TextInputStyle, ApplicationCommandType, ApplicationCommandOptionType } = require("discord.js")
const { SlashCommandBuilder } = require("@discordjs/builders");
const { JsonDatabase, } = require("wio.db");
const dbEmojis = new JsonDatabase({ databasePath: "./databases/emojis.json" });
const dbPerms = new JsonDatabase({ databasePath: "./databases/dbPermissions.json" });
const { getCache } = require("../../../Functions/connect_api");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("anunciar")
        .setDescription("[📢] Envie um anuncio.")
        .addChannelOption(opString => opString
            .setName("channel")
            .setDescription("Qual canal será enviado?")
            .setRequired(true)
        ),

    async execute(interaction, client) {
        // Verificação de permissão
        const type = getCache(null, 'type');
        const dono = getCache(null, "owner");

        if (type?.Vendas?.status == false && type?.Ticket?.status == false) {
            return await interaction.editReply({
                content: `❌ | Você não possui acesso a nenhum de nossos sistemas, adquira um plano em nosso site. [CLIQUE AQUI](https://nevermissapps.com/dashboard) para ser redirecionado.`,
            });
        }

        const isVendas = (await dbPerms.get('vendas'))?.includes(interaction.user.id);
        const isTicket = (await dbPerms.get('ticket'))?.includes(interaction.user.id);
        const isOwner = interaction.user.id === dono;

        if (!isVendas && !isTicket && !isOwner) {
            return await interaction.editReply({
                content: `❌ | Você não tem permissão para usar este comando.`,
            });
        }

        let channel = interaction.options.getChannel('channel')
        let embed = new EmbedBuilder()
            .setTitle("Configure abaixo os campos da embed que deseja configurar.")
            .setFooter({
                text: "Clique em cancelar para cancelar o anúncio."
            })
            .setColor('#ff00b4')

        const send = new EmbedBuilder()
        
        // Tornando a resposta inicial ephemeral
        const Message = await interaction.reply({
            embeds: [embed],
            components: [
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('title')
                            .setLabel('⠀Titulo')
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId('desc')
                            .setLabel('Descrição')
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId('image')
                            .setLabel('Imagem')
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId('tumb')
                            .setLabel('Miniatura')
                            .setStyle(ButtonStyle.Secondary),
                    ),
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('autor')
                            .setLabel('⠀Author⠀')
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId('footer')
                            .setLabel('⠀Rodapé⠀')
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId('date')
                            .setLabel('⠀Data⠀')
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId('cor')
                            .setLabel('⠀Cor⠀')
                            .setStyle(ButtonStyle.Secondary),
                    ),
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('cancelar')
                            .setLabel('Cancelar')
                            .setStyle(ButtonStyle.Danger),
                        new ButtonBuilder()
                            .setCustomId('send')
                            .setLabel('⠀⠀⠀⠀⠀Enviar⠀⠀⠀⠀⠀')
                            .setStyle(ButtonStyle.Success),
                        new ButtonBuilder()
                            .setCustomId('previw')
                            .setLabel('⠀Preview⠀')
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setCustomId('addbutton')
                            .setLabel('Adicionar Botão')
                            .setStyle(ButtonStyle.Primary),
                    ),
            ],
            ephemeral: true // Tornando a resposta ephemeral
        });

        // Armazenar os botões que serão adicionados à mensagem final
        let messageButtons = [];
        let buttonCount = 0;

        const collector = Message.createMessageComponentCollector({ componentType: ComponentType.Button, time: 600_000 });

        collector.on('collect', async buttonsMatch => {
            if (buttonsMatch.user.id === interaction.user.id) {
                if (buttonsMatch.customId == 'cancelar') {
                    await buttonsMatch.deferUpdate();
                    collector.stop();
                } 
                else if (buttonsMatch.customId == 'previw') {
                    // Criar os componentes para a preview
                    const previewComponents = [];
                    if (messageButtons.length > 0) {
                        const rows = [];
                        for (let i = 0; i < messageButtons.length; i += 5) {
                            const row = new ActionRowBuilder();
                            const buttonsInRow = messageButtons.slice(i, i + 5);
                            row.addComponents(buttonsInRow);
                            rows.push(row);
                        }
                        previewComponents.push(...rows);
                    }
                    
                    await buttonsMatch.reply({
                        embeds: [send],
                        components: previewComponents,
                        ephemeral: true
                    }).catch(err => {
                        buttonsMatch.reply({
                            content: `${dbEmojis.get(`13`)} **|** Houve um erro ao processar o anuncio`,
                            ephemeral: true
                        });
                    });
                } 
                else if (buttonsMatch.customId == 'addbutton') {
                    if (buttonCount >= 25) {
                        await buttonsMatch.reply({
                            content: "Você atingiu o limite máximo de 25 botões!",
                            ephemeral: true
                        });
                        return;
                    }
                    
                    const date = 'button_' + Date.now();
                    const collectorFilter = i => {
                        return i.user.id === interaction.user.id && i.customId == date;
                    };

                    const modal = new ModalBuilder()
                        .setCustomId(date)
                        .setTitle('Adicionar Botão')
                        .addComponents(
                            new ActionRowBuilder()
                                .addComponents(
                                    new TextInputBuilder()
                                        .setCustomId('label')
                                        .setLabel("Texto do botão")
                                        .setStyle(TextInputStyle.Short)
                                        .setRequired(true)
                                ),
                            new ActionRowBuilder()
                                .addComponents(
                                    new TextInputBuilder()
                                        .setCustomId('emoji')
                                        .setLabel("Emoji do botão (opcional)")
                                        .setStyle(TextInputStyle.Short)
                                        .setRequired(false)
                                        .setPlaceholder("Ex: 🔗 ou nome:id do emoji personalizado")
                                ),
                            new ActionRowBuilder()
                                .addComponents(
                                    new TextInputBuilder()
                                        .setCustomId('url')
                                        .setLabel("URL do botão")
                                        .setStyle(TextInputStyle.Short)
                                        .setRequired(true)
                                        .setPlaceholder("https://exemplo.com")
                                )
                        );
                    
                    await buttonsMatch.showModal(modal);
                    buttonsMatch.awaitModalSubmit({ time: 600_000, filter: collectorFilter })
                        .then(modalInteraction => {
                            const label = modalInteraction.fields.getTextInputValue('label');
                            const url = modalInteraction.fields.getTextInputValue('url');
                            const emoji = modalInteraction.fields.getTextInputValue('emoji') || null;
                            
                            // Criando o botão com ou sem emoji
                            const newButton = new ButtonBuilder()
                                .setLabel(label)
                                .setURL(url)
                                .setStyle(ButtonStyle.Link);
                                
                            // Adicionar emoji se fornecido
                            if (emoji) {
                                newButton.setEmoji(emoji);
                            }
                                
                            messageButtons.push(newButton);
                            buttonCount++;
                            
                            modalInteraction.reply({
                                content: `Botão "${label}" adicionado com sucesso!`,
                                ephemeral: true
                            });
                        })
                        .catch(err => { 
                            console.error(err);
                            buttonsMatch.followUp({
                                content: `Erro ao adicionar botão: ${err.message}`,
                                ephemeral: true
                            }).catch(() => {});
                        });
                }
                else if (buttonsMatch.customId == 'send') {
                    await buttonsMatch.deferUpdate();
                    
                    // Criar os componentes para a mensagem final
                    const finalComponents = [];
                    if (messageButtons.length > 0) {
                        const rows = [];
                        for (let i = 0; i < messageButtons.length; i += 5) {
                            const row = new ActionRowBuilder();
                            const buttonsInRow = messageButtons.slice(i, i + 5);
                            row.addComponents(buttonsInRow);
                            rows.push(row);
                        }
                        finalComponents.push(...rows);
                    }
                    
                    channel.send({
                        embeds: [send],
                        components: finalComponents
                    }).then(() => {
                        buttonsMatch.followUp({
                            content: `${dbEmojis.get(`14`) || "✅"} **|** Anúncio enviado com sucesso para ${channel}!`,
                            ephemeral: true
                        });
                        collector.stop();
                    }).catch(err => {
                        buttonsMatch.followUp({
                            content: `${dbEmojis.get(`13`)} **|** Houve um erro ao processar o anúncio: ${err.message}`,
                            ephemeral: true
                        });
                    });
                } 
                else if (buttonsMatch.customId == 'title') {
                    const date = 'edit_' + Date.now();
                    const collectorFilter = i => {
                        return i.user.id === interaction.user.id && i.customId == date;
                    };

                    const modal = new ModalBuilder()
                        .setCustomId(date)
                        .setTitle('Title')
                        .addComponents(
                            new ActionRowBuilder()
                                .addComponents(
                                    new TextInputBuilder()
                                        .setCustomId('text')
                                        .setLabel("Qual seria o titulo?")
                                        .setStyle(TextInputStyle.Short)
                                )
                        )
                    buttonsMatch.showModal(modal)
                    buttonsMatch.awaitModalSubmit({ time: 600_000, filter: collectorFilter })
                        .then(interaction => {
                            interaction.deferUpdate();
                            send.setTitle(`${interaction.fields.getTextInputValue('text')}`)
                        })
                        .catch(err => { return err });
                } 
                // Restante dos handlers de botões permanecem os mesmos
                else if (buttonsMatch.customId == 'desc') {
                    const date = 'edit_' + Date.now();
                    const collectorFilter = i => {
                        return i.user.id === interaction.user.id && i.customId == date;
                    };

                    const modal = new ModalBuilder()
                        .setCustomId(date)
                        .setTitle('Desc')
                        .addComponents(
                            new ActionRowBuilder()
                                .addComponents(
                                    new TextInputBuilder()
                                        .setCustomId('text')
                                        .setLabel("Qual seria a desc?")
                                        .setStyle(TextInputStyle.Paragraph)
                                )
                        )
                    buttonsMatch.showModal(modal)
                    buttonsMatch.awaitModalSubmit({ time: 600_000, filter: collectorFilter })
                        .then(interaction => {
                            interaction.deferUpdate();
                            send.setDescription(`${interaction.fields.getTextInputValue('text')}`)
                        })
                        .catch(err => { return err });
                } else if (buttonsMatch.customId == 'image') {
                    const date = 'edit_' + Date.now();
                    const collectorFilter = i => {
                        return i.user.id === interaction.user.id && i.customId == date;
                    };

                    const modal = new ModalBuilder()
                        .setCustomId(date)
                        .setTitle('Image')
                        .addComponents(
                            new ActionRowBuilder()
                                .addComponents(
                                    new TextInputBuilder()
                                        .setCustomId('text')
                                        .setLabel("Qual seria a imagem? Coloque link")
                                        .setStyle(TextInputStyle.Short)
                                )
                        )
                    buttonsMatch.showModal(modal)
                    buttonsMatch.awaitModalSubmit({ time: 600_000, filter: collectorFilter })
                        .then(interaction => {
                            interaction.deferUpdate();
                            send.setImage(`${interaction.fields.getTextInputValue('text')}`)
                        })
                        .catch(err => { return err });
                } else if (buttonsMatch.customId == 'tumb') {
                    const date = 'edit_' + Date.now();
                    const collectorFilter = i => {
                        return i.user.id === interaction.user.id && i.customId == date;
                    };

                    const modal = new ModalBuilder()
                        .setCustomId(date)
                        .setTitle('Tumb')
                        .addComponents(
                            new ActionRowBuilder()
                                .addComponents(
                                    new TextInputBuilder()
                                        .setCustomId('text')
                                        .setLabel("Qual seria a Tumb? Coloque link")
                                        .setStyle(TextInputStyle.Short)
                                )
                        )
                    buttonsMatch.showModal(modal)
                    buttonsMatch.awaitModalSubmit({ time: 600_000, filter: collectorFilter })
                        .then(interaction => {
                            interaction.deferUpdate();
                            send.setThumbnail(`${interaction.fields.getTextInputValue('text')}`)
                        })
                        .catch(err => { return err });
                } else if (buttonsMatch.customId == 'autor') {
                    const date = 'edit_' + Date.now();
                    const collectorFilter = i => {
                        return i.user.id === interaction.user.id && i.customId == date;
                    };

                    const modal = new ModalBuilder()
                        .setCustomId(date)
                        .setTitle('Autor')
                        .addComponents(
                            new ActionRowBuilder()
                                .addComponents(
                                    new TextInputBuilder()
                                        .setCustomId('text')
                                        .setLabel("Qual seria o autor?")
                                        .setStyle(TextInputStyle.Short)
                                )
                        )
                    buttonsMatch.showModal(modal)
                    buttonsMatch.awaitModalSubmit({ time: 600_000, filter: collectorFilter })
                        .then(interaction => {
                            interaction.deferUpdate();
                            send.setAuthor({ name: `${interaction.fields.getTextInputValue('text')}` })
                        })
                        .catch(err => { return err });
                } else if (buttonsMatch.customId == 'footer') {
                    const date = 'edit_' + Date.now();
                    const collectorFilter = i => {
                        return i.user.id === interaction.user.id && i.customId == date;
                    };

                    const modal = new ModalBuilder()
                        .setCustomId(date)
                        .setTitle('Footer')
                        .addComponents(
                            new ActionRowBuilder()
                                .addComponents(
                                    new TextInputBuilder()
                                        .setCustomId('text')
                                        .setLabel("Qual seria o footer?")
                                        .setStyle(TextInputStyle.Short)
                                )
                        )
                    buttonsMatch.showModal(modal)
                    buttonsMatch.awaitModalSubmit({ time: 600_000, filter: collectorFilter })
                        .then(interaction => {
                            interaction.deferUpdate();
                            send.setFooter({ text: `${interaction.fields.getTextInputValue('text')}` })
                        })
                        .catch(err => { return err });
                } else if (buttonsMatch.customId == 'date') {
                    buttonsMatch.deferUpdate()
                    send.setTimestamp()
                } else if (buttonsMatch.customId == 'cor') {
                    const date = 'edit_' + Date.now();
                    const collectorFilter = i => {
                        return i.user.id === interaction.user.id && i.customId == date;
                    };

                    const modal = new ModalBuilder()
                        .setCustomId(date)
                        .setTitle('Cor')
                        .addComponents(
                            new ActionRowBuilder()
                                .addComponents(
                                    new TextInputBuilder()
                                        .setCustomId('text')
                                        .setLabel("Coloque a cor com hexadecimal")
                                        .setStyle(TextInputStyle.Short)
                                )
                        )
                    buttonsMatch.showModal(modal)
                    buttonsMatch.awaitModalSubmit({ time: 600_000, filter: collectorFilter })
                        .then(interaction => {
                            interaction.deferUpdate();
                            send.setColor(`${interaction.fields.getTextInputValue('text')}`)
                        })
                        .catch(err => { return err });
                }
            }
        });

        collector.on('end', () => {
            // Limpeza após o término do coletor
            try {
                interaction.editReply({
                    components: []
                }).catch(() => {});
            } catch (err) {
                // Ignora erros se a mensagem já foi deletada
            }
        });
    }
}