const { MessageFlags, EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");
const { JsonDatabase } = require("wio.db");
const { getCache } = require("../../../Functions/connect_api");
const dbConfigs = new JsonDatabase({ databasePath: "./databases/dbConfigs.json" });
const dbProducts = new JsonDatabase({ databasePath: "./databases/dbProducts.json" });
const dbPerms = new JsonDatabase({ databasePath: "./databases/dbPermissions.json" });

const dbe = new JsonDatabase({ databasePath: "./databases/emojis-globais.json" });

module.exports = {
    data: new SlashCommandBuilder()
        .setName("set-produto")
        .setDescription("Envie a mensagem de compra!")
        .addStringOption(opString => opString
            .setName("id")
            .setDescription("ID do Produto")
            .setMaxLength(25)
            .setAutocomplete(true)
            .setRequired(true)
        ),

    async autocomplete(interaction) {
        const choices = [];
        let type = getCache(null, 'type')
        let dono = getCache(null, "owner")
        if (type?.Vendas?.status !== true) {
            const semPerm = {
                name: "❌ | Comando desabilitado pois o bot não possui o sistema de venda adquirido.",
                value: "no-perms"
            }
            choices.push(semPerm)
            await interaction.respond(
                choices.map(choice => ({ name: choice.name, value: choice.value }))
            )
            return
        }



        for (const product of dbProducts.all()) {
            choices.push({
                name: `ID: ${product.ID} | Nome: ${product.data.name}`,
                value: product.ID,
            });
        };
        choices.sort((a, b) => a.value - b.value);

        const searchId = interaction.options.getString("id");
        if (searchId) {

            const filteredChoices = choices.filter(choice => {
                return choice.name.toLowerCase().includes(searchId.toLowerCase());
            });
            await interaction.respond(
                filteredChoices.map(choice => ({ name: choice.name, value: choice.value })),
            );
        } else {
            const limitedChoices = choices.slice(0, 25);
            await interaction.respond(
                limitedChoices.map(choice => ({ name: choice.name, value: choice.value }))
            );
        };

    },

    async execute(interaction, client) {
        let type = getCache(null, 'type')
        let dono = getCache(null, "owner")
        if (type?.Vendas?.status !== true) {
            interaction.reply({ content: `❌ | Você não possui acesso a nosso sistema de **VENDAS**, adquira um em nosso discord utilizando **/renovar**. [CLIQUE AQUI](https://discord.com/channels/1289642313412251780/1289642314096054361) para ser redirecionado.`, flags: MessageFlags.Ephemeral })
            return
        }

        const choices = [];

        const isInDb = (await dbPerms.get("vendas"))?.includes(interaction.user.id);
        const isOwner = interaction.user.id === dono;

        if (!isInDb && !isOwner) {
            const noPermOption = {
                name: "Você não tem permissão para usar este comando!",
                value: "no-perms"
            };
            choices.push(noPermOption);
            await interaction.respond(
                choices.map(choice => ({ name: choice.name, value: choice.value })),
            );
            return;
        }

        const idProduct = interaction.options.getString("id");

        if (!dbProducts.has(idProduct)) {
            await interaction.reply({
                content: `❌ | ID do produto: **${idProduct}** não foi encontrado.`,
                flags: MessageFlags.Ephemeral
            });
            return;
        };

        const nameP = await dbProducts.get(`${idProduct}.name`);
        const descriptionP = await dbProducts.get(`${idProduct}.description`);
        const thumbP = await dbProducts.get(`${idProduct}.thumbUrl`);
        const bannerP = await dbProducts.get(`${idProduct}.bannerUrl`);
        const colorP = await dbProducts.get(`${idProduct}.color`);
        const priceP = await dbProducts.get(`${idProduct}.price`);
        const estoqueP = await dbProducts.get(`${idProduct}.stock`);

        //emojis
        const dinheiroEmoji = `<:dinheiro:${await dbe.get('dinheiro')}>`;
        const caixaEmoji = `<:caixa:${dbe.get('caixa')}>`;
        const userEmoji = `<:user:${dbe.get('user')}>`;
        const estrelaEmoji = `<a:estrela:${dbe.get('estrela')}>`;
        const calendarioEmoji = `<:calendario:${dbe.get('calendario')}>`;
        const umEmoji = `<:um:${dbe.get('um')}>`;
        const doisEmoji = `<:dois:${dbe.get('dois')}>`;
        const tresEmoji = `<:tres:${dbe.get('tres')}>`;
        const quatroEmoji = `<:quatro:${dbe.get('quatro')}>`;
        const cincoEmoji = `<:cinco:${dbe.get('cinco')}>`;
        const seisEmoji = `<:seis:${dbe.get('seis')}>`;
        const seteEmoji = `<:sete:${dbe.get('sete')}>`;
        const oitoEmoji = `<:oito:${dbe.get('oito')}>`;
        const desligadoEmoji = `<:desligado:${await dbe.get('desligado')}>`;
        const ligadoEmoji = `<:ligado:${await dbe.get('ligado')}>`;
        const configEmoji = `<:config:${await dbe.get('config')}>`;
        const saco_dinheiroEmoji = `<:saco_dinheiro:${await dbe.get('saco_dinheiro')}>`;
        const mensagem = `<:mensagem:${await dbe.get('mensagem')}>`;
        const suporteEmoji = `<:suporte:${await dbe.get('suporte')}>`;
        const editarEmoji = `<:editar:${await dbe.get('editar')}>`;
        const corEmoji = `<:cor:${await dbe.get('cor')}>`;
        const imagemEmoji = `<:imagem:${await dbe.get('imagem')}>`;
        const lupaEmoji = `<:lupa:${await dbe.get('lupa')}>`;
        const modalEmoji = `<:modal:${await dbe.get('modal')}>`;
        const docEmoji = `<:doc:${await dbe.get('doc')}>`;
        const loadingEmoji = `<a:loading:${await dbe.get('loading')}>`;
        const lixoEmoji = `<:lixo:${await dbe.get('lixo')}>`;
        const carrinhoEmoji = `<:carrinho:${await dbe.get('carrinho')}>`;
        const cupomEmoji = `<:cupom:${await dbe.get('cupom')}>`;
        const voltarEmoji = `<:voltar:${await dbe.get('voltar')}>`;

        const thumbC = await dbConfigs.get(`vendas.images.thumbUrl`);
        const bannerC = await dbConfigs.get(`vendas.images.bannerUrl`);
        const colorC = await dbConfigs.get(`vendas.embeds.color`);

        const buttonDuvidas = await dbConfigs.get(`buttonDuvidas`);

        const embedProduct = new EmbedBuilder()
            .setAuthor({ name: `${nameP}` })
            .setDescription(`
            ${umEmoji}${doisEmoji}${tresEmoji}${quatroEmoji}${cincoEmoji}${seisEmoji}${seteEmoji}${oitoEmoji}\n\n${descriptionP}
            `)
            .addFields(
                { name: `Valor à vista`, value: `\`${Number(priceP).toLocaleString(global.lenguage.um, { style: 'currency', currency: global.lenguage.dois })}\``, inline: true },
                { name: `Restam`, value: `\`${estoqueP.length}\``, inline: true }
            )
            .setThumbnail(thumbP !== "none" ? thumbP : thumbC !== "none" ? thumbC : "https://sem-img.com")
            .setImage(bannerP !== "none" ? bannerP : bannerC !== "none" ? bannerC : "https://sem-img.com")
            .setColor(colorP != "none" ? colorP : colorC != "none" ? colorC : "#460580");

        if (buttonDuvidas !== "none") {
            const msg = await interaction.channel.send({
                content: ``,
                embeds: [embedProduct],
                components: [
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder().setCustomId(idProduct).setLabel(`Comprar`).setEmoji(`<:carrinho:1236021394610061352>`).setStyle(`Success`),
                            new ButtonBuilder().setURL(`https://discord.com/channels/${interaction.guild.id}/${buttonDuvidas}`).setLabel(`Dúvidas`).setEmoji(`${suporteEmoji}`).setStyle(`Link`)
                        )
                ]
            });
            await dbProducts.set(`${idProduct}.msgLocalization.channelId`, interaction.channel.id);
            await dbProducts.set(`${idProduct}.msgLocalization.messageId`, msg.id);

        } else {
            const msg = await interaction.channel.send({
                content: ``,
                embeds: [embedProduct],
                components: [
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder().setCustomId(idProduct).setLabel(`Comprar`).setEmoji(`<:carrinho:1236021394610061352>`).setStyle(`Success`)
                        )
                ]
            });

            await dbProducts.set(`${idProduct}.msgLocalization.channelId`, interaction.channel.id);
            await dbProducts.set(`${idProduct}.msgLocalization.messageId`, msg.id);
        }

        await interaction.reply({
            content: `✅ | Produto setado com sucesso no canal: ${interaction.channel}.`,
            flags: MessageFlags.Ephemeral
        });
    },
};