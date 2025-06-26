const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const AdminSession = sequelize.define('AdminSession', {
        id: {
            type: DataTypes.STRING(64),
            primaryKey: true,
            allowNull: false
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'id'
            }
        },
        ipAddress: {
            type: DataTypes.STRING(45), // Support IPv6
            allowNull: false
        },
        userAgent: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        expiresAt: {
            type: DataTypes.DATE,
            allowNull: false
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            allowNull: false
        },
        lastActivity: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            allowNull: false
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            allowNull: false
        },
        revokedAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        revokedBy: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'Users',
                key: 'id'
            }
        },
        metadata: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: {}
        }
    }, {
        tableName: 'admin_sessions',
        timestamps: false,
        indexes: [
            {
                fields: ['userId']
            },
            {
                fields: ['expiresAt']
            },
            {
                fields: ['isActive']
            },
            {
                fields: ['ipAddress']
            },
            {
                fields: ['lastActivity']
            }
        ]
    });

    // Instance methods
    AdminSession.prototype.isExpired = function () {
        return new Date() > this.expiresAt;
    };

    AdminSession.prototype.revoke = function (revokedBy = null) {
        this.isActive = false;
        this.revokedAt = new Date();
        this.revokedBy = revokedBy;
        return this.save();
    };

    AdminSession.prototype.extend = function (hours = 8) {
        this.expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
        this.lastActivity = new Date();
        return this.save();
    };

    // Class methods
    AdminSession.createSession = async function (userId, ipAddress, userAgent, expiresInHours = 8) {
        const sessionId = require('crypto').randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

        return this.create({
            id: sessionId,
            userId,
            ipAddress,
            userAgent,
            expiresAt,
            isActive: true,
            lastActivity: new Date()
        });
    };

    AdminSession.revokeAllUserSessions = async function (userId, revokedBy = null) {
        return this.update(
            {
                isActive: false,
                revokedAt: new Date(),
                revokedBy
            },
            {
                where: {
                    userId,
                    isActive: true
                }
            }
        );
    };

    AdminSession.cleanupExpired = async function () {
        const expiredCount = await this.destroy({
            where: {
                expiresAt: {
                    [require('sequelize').Op.lt]: new Date()
                }
            }
        });
        return expiredCount;
    };

    AdminSession.getActiveSessions = async function (userId) {
        return this.findAll({
            where: {
                userId,
                isActive: true,
                expiresAt: {
                    [require('sequelize').Op.gt]: new Date()
                }
            },
            order: [['lastActivity', 'DESC']]
        });
    };

    return AdminSession;
};
