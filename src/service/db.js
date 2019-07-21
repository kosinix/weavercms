//// Core modules

//// External modules
const Sequelize = require('sequelize');

module.exports = (container) => {
    let config = container.get('config');
    let cred = container.get('cred');

    // DB
    let sequelize = new Sequelize(config.db.name, cred.db.username, cred.db.password, config.sequelize);

    const User = sequelize.define('user', {
        username: {
            type: Sequelize.STRING
        },
        password: {
            type: Sequelize.STRING,
            validate: {
                min: {
                    msg: "Please provide a Title"
                }
            }
        },
        email: {
            type: Sequelize.STRING
        },
        remember: {
            type: Sequelize.STRING
        }
    }, {timestamps: false});

    const Page = sequelize.define('page', {
        title: {
            type: Sequelize.STRING,
            validate: {
                notEmpty: {
                    msg: "Please provide a Title"
                }
            }
        },
        location: {
            type: Sequelize.STRING,
            validate: {
                notEmpty: {
                    msg: "Please provide a Location"
                },
                // custom validations are also possible:
                isUnique(value, next) {
                    Page.findOne({where: {location: value}}).then((page)=>{
                        if(page){
                            return next('Location not already taken.');
                        }
                        return next();
                    }).catch((err)=>{
                        return next(err);
                    });

                }
            }
        },
        content: {
            type: Sequelize.STRING
        },
        visibility: {
            type: Sequelize.STRING
        },
        static: {
            type: Sequelize.INTEGER
        },
        code: {
            type: Sequelize.STRING
        }
    });

    const File = sequelize.define('file', {
        uid: {
            type: Sequelize.STRING,
            validate: {
                notEmpty: {
                    msg: "Please provide a Unique Identifier"
                }
            }
        },
        originalName: {
            type: Sequelize.STRING,
            validate: {
                notEmpty: {
                    msg: "Please provide a Original Name"
                }
            }
        },
        location: {
            type: Sequelize.STRING,
            validate: {
                notEmpty: {
                    msg: "Please provide a Location"
                }
            }
        },
        title: {
            type: Sequelize.STRING,
        },
        description: {
            type: Sequelize.STRING,
        },
        type: {
            type: Sequelize.STRING,
        }
    });

    const Variant = sequelize.define('variant', {
        uid: {
            type: Sequelize.STRING,
            validate: {
                notEmpty: {
                    msg: "Please provide a Unique Identifier"
                }
            }
        },
        parentUid: {
            type: Sequelize.STRING,
        },
        name: {
            type: Sequelize.STRING,
        },
        title: {
            type: Sequelize.STRING,
        },
        description: {
            type: Sequelize.STRING,
        },
        anchorX: {
            type: Sequelize.INTEGER,
        },
        anchorY: {
            type: Sequelize.INTEGER,
        },
        width: {
            type: Sequelize.INTEGER,
        },
        height: {
            type: Sequelize.INTEGER,
        },
        mode: {
            type: Sequelize.STRING,
        },
        location: {
            type: Sequelize.STRING,
        },
        visibility: {
            type: Sequelize.STRING,
        }
    });

    File.hasMany(Variant, { foreignKey: 'parentUid', sourceKey: 'uid' })

    return {
        Sequelize: Sequelize,
        sequelize: sequelize,
        User: User,
        Page: Page,
        File: File,
        Variant: Variant,
    };
};